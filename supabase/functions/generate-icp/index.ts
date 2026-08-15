import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface ClientCompany {
  name: string
  industry: string | null
  employee_count: number | null
  country: string | null
  city: string | null
  client_notes: string | null
}

interface CompanyProfile {
  company_name: string | null
  what_we_sell: string | null
  who_we_sell_to: string | null
  typical_deal_size: string | null
  problem_we_solve: string | null
}

interface ClaudeContentBlock {
  text?: string
}

interface ClaudeResponse {
  content?: ClaudeContentBlock[]
}

interface ParsedIcp {
  name: string
  description: string
  industries: string[]
  size_range: string
  signals: string[]
  anti_signals: string[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'Required edge function secrets are not configured' }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : { data: { user: null }, error: null }

    if (!user || userError) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: CORS_HEADERS }
      )
    }

    // Fetch company profile for context
    const { data: companyProfile } = await supabase
      .from('company_profile')
      .select('company_name, what_we_sell, who_we_sell_to, typical_deal_size, problem_we_solve')
      .eq('user_id', user.id)
      .maybeSingle<CompanyProfile>()

    const { data: clients, error: clientsError } = await supabase
      .from('companies')
      .select('name, industry, employee_count, country, city, client_notes')
      .eq('is_client', true)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .returns<ClientCompany[]>()

    if (clientsError) {
      console.error('[generate-icp] client query error:', clientsError)
      return new Response(
        JSON.stringify({ error: 'Failed to load clients', detail: clientsError.message }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    if (!clients || clients.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Add at least 2 clients before generating an ICP' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const clientList = clients.map((client) =>
      `- ${client.name}: ${client.industry ?? 'unknown industry'}, ` +
      `${client.employee_count ?? '?'} employees, ` +
      `${[client.city ?? '', client.country ?? ''].join(' ').trim()}. ` +
      `${client.client_notes ?? ''}`
    ).join('\n')

    const companyContext = companyProfile
      ? `
OUR COMPANY:
Name: ${companyProfile.company_name ?? 'Unknown'}
What we sell: ${companyProfile.what_we_sell ?? 'Not specified'}
Who we sell to: ${companyProfile.who_we_sell_to ?? 'Not specified'}
Typical deal size: ${companyProfile.typical_deal_size ?? 'Not specified'}
Problem we solve: ${companyProfile.problem_we_solve ?? 'Not specified'}
`
      : 'No company profile configured — infer from client patterns only.\n'

    const systemPrompt = 'You are a senior B2B sales strategist analyzing a company\'s existing client base to define their Ideal Customer Profile (ICP). You return structured JSON only. No markdown fences, no explanation.'

    const dynamicPrompt = `${companyContext}
Existing clients and why they are good customers:
${clientList}

Based on what this company sells and who their best clients have been,
identify the patterns that define their ideal customer.

Return ONLY valid JSON, no other text:
{
"name": "Default ICP",
"description": "2-3 sentence summary of the ideal customer",
"industries": ["array", "of", "target", "industries"],
"size_range": "e.g. 20-200 employees",
"signals": [
"positive signal 1",
"positive signal 2",
"positive signal 3"
],
"anti_signals": [
"negative signal 1",
"negative signal 2"
]
}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: dynamicPrompt },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('[generate-icp] Claude API error:', claudeResponse.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Claude API request failed', detail: errorText }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const claudeData = await claudeResponse.json() as ClaudeResponse
    const rawContent = claudeData.content?.[0]?.text ?? ''
    const parsed = parseIcp(rawContent)

    if (!parsed) {
      console.error('[generate-icp] Failed to parse Claude JSON:', rawContent)
      return new Response(
        JSON.stringify({ error: 'Failed to parse ICP profile', raw: rawContent }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const { error: deleteError } = await supabase
      .from('icp_profiles')
      .delete()
      .eq('name', 'Default ICP')
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[generate-icp] delete error:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to replace existing ICP', detail: deleteError.message }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const { data: profile, error: insertError } = await supabase
      .from('icp_profiles')
      .insert({
        name: 'Default ICP',
        description: parsed.description,
        industries: parsed.industries,
        size_range: parsed.size_range,
        signals: parsed.signals,
        anti_signals: parsed.anti_signals,
        user_id: user.id,
        client_count: clients.length,
        generated_at: new Date().toISOString(),
        criteria: {
          industries: parsed.industries,
          size_range: parsed.size_range,
          signals: parsed.signals,
          anti_signals: parsed.anti_signals,
        },
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[generate-icp] insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store ICP profile', detail: insertError.message }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return new Response(JSON.stringify({ success: true, profile }), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (error) {
    console.error('[generate-icp] unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})

function parseIcp(rawContent: string): ParsedIcp | null {
  try {
    const parsed = JSON.parse(extractJson(rawContent)) as Partial<ParsedIcp>
    return {
      name: parsed.name || 'Default ICP',
      description: parsed.description || '',
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      size_range: parsed.size_range || '',
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      anti_signals: Array.isArray(parsed.anti_signals) ? parsed.anti_signals : [],
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
