import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface IcpProfile {
  description: string
  industries: string[]
  size_range: string
  signals: string[]
  anti_signals: string[]
}

interface CompanyProfile {
  company_name: string | null
  what_we_sell: string | null
  who_we_sell_to: string | null
}

interface ClaudeContentBlock {
  text?: string
}

interface ClaudeResponse {
  content?: ClaudeContentBlock[]
}

interface ApolloOrganization {
  id?: string | null
  name?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  short_description?: string | null
  industry?: string | null
  estimated_num_employees?: number | null
  city?: string | null
  country?: string | null
  keywords?: string[] | null
  technology_names?: string[] | null
}

interface ApolloSearchResponse {
  organizations?: ApolloOrganization[]
  pagination?: {
    total_entries?: number
    total_pages?: number
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const apolloKey = Deno.env.get('APOLLO_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!anthropicKey || !apolloKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required secrets' }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } =
      await supabase.auth.getUser(token)

    if (!user || userError) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: CORS_HEADERS }
      )
    }

    const { data: icp } = await supabase
      .from('icp_profiles')
      .select('description, industries, size_range, signals, anti_signals')
      .eq('name', 'Default ICP')
      .eq('user_id', user.id)
      .single<IcpProfile>()

    if (!icp) {
      return new Response(
        JSON.stringify({
          error: 'No ICP profile found. Generate an ICP profile first.',
        }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const { data: companyProfile } = await supabase
      .from('company_profile')
      .select('company_name, what_we_sell, who_we_sell_to')
      .eq('user_id', user.id)
      .single<CompanyProfile>()

    const claudePrompt = `You are translating an ICP profile into
Apollo.io organization search API filter parameters.

${companyProfile ? `
Our company: ${companyProfile.company_name}
We sell: ${companyProfile.what_we_sell}
We target: ${companyProfile.who_we_sell_to}
` : ''}

ICP Profile:
${icp.description}

Target size: ${icp.size_range}

Positive signals (context only — do NOT turn these into keyword search terms.
Apollo would match that exact vocabulary against company descriptions, which
surfaces vendors who describe their own product using the same words this ICP
uses to describe its pain point, not companies that experience the pain
internally. A separate scoring step already reasons over full company
descriptions to judge these signals qualitatively — your job here is coarse
structural filtering only):
${icp.signals.map((signal) => `+ ${signal}`).join('\n')}

Anti-signals (context only, same rule applies):
${icp.anti_signals.map((signal) => `- ${signal}`).join('\n')}

You decide two structural filters: employee count range and geography.

Return ONLY valid JSON, no other text:
{
  "organization_num_employees_ranges": ["min,max as string e.g. 10,500"],
  "organization_locations": ["Finland", "Sweden", "Norway"],
  "per_page": 25
}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: claudePrompt }],
      }),
    })

    if (!claudeRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Claude API failed' }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const claudeData = await claudeRes.json() as ClaudeResponse
    const rawContent = claudeData.content?.[0]?.text ?? ''

    let apolloFilters: Record<string, unknown>
    try {
      const clean = rawContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      apolloFilters = JSON.parse(clean) as Record<string, unknown>
    } catch {
      console.error('[icp-search] Failed to parse Claude filters:', rawContent)
      return new Response(
        JSON.stringify({ error: 'Failed to generate search filters' }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    // Apollo's /organizations/search has no dedicated industry-id filter —
    // per Apollo's own docs, industry is expressed via q_organization_keyword_tags
    // (their example: "mining" as a keyword tag returns mining-industry companies).
    // Set this deterministically from the ICP's target_industries — never from
    // Claude's guesses, and never from the ICP's pain-point signals, which is what
    // pulled in HR-tech vendors and staffing agencies instead of genuine buyers.
    apolloFilters.q_organization_keyword_tags = Array.from(
      new Set(
        icp.industries
          .map((industry) => industry.trim().toLowerCase())
          .filter((industry) => industry.length > 0)
      )
    )

    // Apollo has no keyword-exclusion parameter for this endpoint, so when a
    // target industry is itself a vendor category (e.g. "Staffing and
    // Recruitment"), search can't structurally distinguish a client in that
    // industry from a competing vendor in it — that disambiguation is left to
    // the scoring step, which already reasons over full company descriptions
    // and correctly downgrades vendor/competitor matches (verified in testing).

    // Job-posting-volume filters (organization_num_jobs_range etc.) would be a
    // stronger structural pain-signal proxy than keyword matching, but they're
    // an Apollo "advanced filter" gated behind a paid plan — this account is on
    // the free plan and gets a 422 if they're included. Not used until upgraded.

    console.log('[icp-search] Apollo filters:', JSON.stringify(apolloFilters))

    const apolloRes = await fetch(
      'https://api.apollo.io/api/v1/organizations/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apolloKey,
        },
        body: JSON.stringify({
          ...apolloFilters,
          per_page: 25,
        }),
      }
    )

    if (!apolloRes.ok) {
      const errText = await apolloRes.text()
      console.error('[icp-search] Apollo error:', apolloRes.status, errText)
      return new Response(
        JSON.stringify({
          error: 'Apollo search failed',
          status: apolloRes.status,
        }),
        { status: 502, headers: CORS_HEADERS }
      )
    }

    const apolloData = await apolloRes.json() as ApolloSearchResponse

    const mapped = {
      organizations: (apolloData.organizations ?? [])
        .filter((org) => Boolean(org.name?.trim()) && Boolean(org.website_url?.trim()))
        .map((org) => ({
          id: org.id ?? '',
          name: org.name ?? '',
          website_url: org.website_url ?? null,
          blog_url: null,
          linkedin_url: org.linkedin_url ?? null,
          short_description: org.short_description ?? null,
          industry: org.industry ?? null,
          estimated_num_employees: org.estimated_num_employees ?? null,
          city: org.city ?? null,
          country: org.country ?? null,
          keywords: org.keywords ?? [],
          technology_names: org.technology_names ?? [],
        })),
      pagination: {
        page: 1,
        per_page: 25,
        total_entries: apolloData.pagination?.total_entries ?? 0,
        total_pages: apolloData.pagination?.total_pages ?? 0,
      },
      filters_used: apolloFilters,
    }

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (error) {
    console.error('[icp-search] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})
