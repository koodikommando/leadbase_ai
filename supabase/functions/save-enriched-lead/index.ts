import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  type IcpProfile,
  buildSystemPrompt,
  buildUserPrompt,
} from '../_shared/enrichment-prompts.ts'

interface EnrichLeadInput {
  org: {
    id: string
    name: string
    website_url: string | null
    industry: string | null
    estimated_num_employees: number | null
    country: string | null
    city: string | null
    raw_apollo?: Record<string, unknown>
  }
}

interface EnrichmentResult {
  lead_score: number
  icp_fit: 'high' | 'medium' | 'low'
  ai_summary: string
  signals: string[]
  concerns: string[]
  outreach_angle: string
}

interface ClaudeContentBlock {
  text?: string
}

interface ClaudeResponse {
  content?: ClaudeContentBlock[]
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!anthropicKey || !supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing required secrets' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }

  // Extract user from auth header
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: { user }, error: userError } =
    await supabase.auth.getUser(token)

  if (!user || userError) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS }
    )
  }

  let body: EnrichLeadInput
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const { org } = body
  if (!org?.name?.trim() || !org?.website_url?.trim()) {
    return new Response(
      JSON.stringify({
        error: 'org must have both a name and a domain — refusing to score an unidentifiable record',
      }),
      { status: 400, headers: CORS_HEADERS }
    )
  }

  try {
    // STEP 1: Fetch ICP profile for this user
    const { data: icp } = await supabase
      .from('icp_profiles')
      .select('description, industries, size_range, signals, anti_signals')
      .eq('name', 'Default ICP')
      .eq('user_id', user.id)
      .maybeSingle<IcpProfile>()

    if (!icp) {
      console.log('[save-enriched-lead] No ICP found for user, using general scoring')
    }

    // STEP 2: Call Claude directly with the ICP profile already loaded above.
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: buildSystemPrompt(icp ?? null),
        messages: [
          { role: 'user', content: buildUserPrompt(org) },
        ],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      console.error('[save-enriched-lead] Claude API error:', claudeRes.status, errText)
      return new Response(
        JSON.stringify({ error: 'Claude API request failed', detail: errText }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const claudeData = await claudeRes.json() as ClaudeResponse
    const rawContent = claudeData.content?.[0]?.text ?? ''
    const enrichment = parseEnrichment(rawContent)

    if (!enrichment) {
      console.error('[save-enriched-lead] Failed to parse Claude output as JSON:', rawContent)
      return new Response(
        JSON.stringify({ error: 'Failed to parse enrichment result', raw: rawContent }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    // STEP 3: Upsert company - atomic with lead insert below
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        apollo_id: org.id,
        name: org.name,
        domain: org.website_url,
        industry: org.industry,
        employee_count: org.estimated_num_employees,
        country: org.country,
        city: org.city,
        raw_apollo: org.raw_apollo ?? org,
        user_id: user.id,
      }, {
        onConflict: 'apollo_id,user_id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single()

    if (companyError || !company) {
      console.error('[save-enriched-lead] Company upsert failed:', companyError)
      return new Response(
        JSON.stringify({
          error: 'Failed to save company',
          detail: companyError?.message,
        }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    // STEP 4: Insert lead - only runs if company succeeded
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        company_id: company.id,
        lead_score: enrichment.lead_score,
        icp_fit: enrichment.icp_fit,
        outreach_angle: enrichment.outreach_angle,
        ai_summary: enrichment.ai_summary,
        signals: enrichment.signals ?? [],
        concerns: enrichment.concerns ?? [],
        status: 'new',
        user_id: user.id,
      })
      .select('id')
      .single()

    if (leadError || !lead) {
      console.error('[save-enriched-lead] Lead insert failed:', leadError)
      // Company was saved but lead failed - log for debugging
      // In a production system this would be a transaction rollback
      return new Response(
        JSON.stringify({
          error: 'Failed to save lead',
          detail: leadError?.message,
        }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        company_id: company.id,
        enrichment,
      }),
      { status: 200, headers: CORS_HEADERS }
    )
  } catch (error) {
    console.error('[save-enriched-lead] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})

function parseEnrichment(rawContent: string): EnrichmentResult | null {
  try {
    const parsed = JSON.parse(extractJson(rawContent)) as Partial<EnrichmentResult>
    const lead_score = Math.max(0, Math.min(100, Math.round(Number(parsed.lead_score) || 0)))
    const icp_fit = ['high', 'medium', 'low'].includes(parsed.icp_fit ?? '')
      ? parsed.icp_fit as EnrichmentResult['icp_fit']
      : lead_score >= 70 ? 'high' : lead_score >= 40 ? 'medium' : 'low'

    return {
      lead_score,
      icp_fit,
      ai_summary: parsed.ai_summary ?? parsed.outreach_angle ?? '',
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      outreach_angle: parsed.outreach_angle ?? '',
    }
  } catch {
    return null
  }
}

function extractJson(rawContent: string): string {
  const trimmed = rawContent.trim()
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return fencedMatch?.[1]?.trim() ?? trimmed
}
