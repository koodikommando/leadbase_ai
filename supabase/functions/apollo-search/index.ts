
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface ApolloOrganizationResult {
  id?: string | null
  name?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  industry?: string | null
  estimated_num_employees?: number | string | null
  city?: string | null
  country?: string | null
  keywords?: string[] | null
  organization_revenue_printed?: string | null
  founded_year?: number | string | null
  primary_domain?: string | null
}

interface ApolloSearchResponse {
  organizations?: ApolloOrganizationResult[]
  pagination?: {
    page?: number
    per_page?: number
    total_entries?: number
    total_pages?: number
  }
}

interface MappedOrganization {
  id: string
  name: string
  website_url: string | null
  blog_url: null
  linkedin_url: string | null
  short_description: string | null
  industry: string | null
  estimated_num_employees: number | null
  city: string | null
  country: string | null
  keywords: string[]
  technology_names: string[]
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    // Parse request
    const { query, per_page = 10 } = await req.json() as {
      query: string
      per_page?: number
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const trimmed = query.trim()
    const apolloKey = Deno.env.get('APOLLO_API_KEY')

    if (!apolloKey) {
      console.error('[apollo-search] APOLLO_API_KEY secret is not set')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing API key' }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    const apolloData = await searchApolloOrganizations(trimmed, per_page, apolloKey)
    const mapped = mapApolloSearchResponse(apolloData, per_page)

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (error) {
    console.error('apollo-search function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})

async function searchApolloOrganizations(
  query: string,
  perPage: number,
  apolloKey: string
): Promise<ApolloSearchResponse> {
  const response = await fetch('https://api.apollo.io/api/v1/organizations/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apolloKey,
    },
    body: JSON.stringify({
      q_organization_name: query,
      per_page: perPage,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Apollo API error:', response.status, errorText)
    throw new Error(`Apollo search failed with status ${response.status}`)
  }

  return await response.json() as ApolloSearchResponse
}

function mapApolloSearchResponse(data: ApolloSearchResponse, perPage: number) {
  const organizations = (data.organizations ?? []).filter(
    (org) =>
      Boolean(org.name?.trim()) &&
      (Boolean(org.website_url?.trim()) || Boolean(org.primary_domain?.trim()))
  )
  const totalEntries = data.pagination?.total_entries ?? organizations.length

  return {
    organizations: organizations.slice(0, perPage).map(mapApolloOrganization),
    pagination: {
      page: data.pagination?.page ?? 1,
      per_page: data.pagination?.per_page ?? perPage,
      total_entries: totalEntries,
      total_pages: data.pagination?.total_pages ?? Math.ceil(totalEntries / perPage),
    },
  }
}

function mapApolloOrganization(org: ApolloOrganizationResult): MappedOrganization {
  const primaryDomain = normalizeDomain(org.primary_domain)

  return {
    id: org.id ?? primaryDomain ?? org.name ?? '',
    name: org.name ?? '',
    website_url: getWebsiteUrl(org.website_url, primaryDomain),
    blog_url: null,
    linkedin_url: org.linkedin_url ?? null,
    short_description: getApolloShortDescription(org),
    industry: org.industry ?? null,
    estimated_num_employees: getEmployeeCount(org.estimated_num_employees),
    city: org.city ?? null,
    country: org.country ?? null,
    keywords: getKeywords(org.keywords),
    technology_names: [],
  }
}

function getWebsiteUrl(websiteUrl: string | null | undefined, primaryDomain: string | null): string | null {
  const url = websiteUrl?.trim()
  if (url) {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`
  }

  return primaryDomain ? `https://${primaryDomain}` : null
}

function normalizeDomain(domain: string | null | undefined): string | null {
  const trimmed = domain?.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

function getEmployeeCount(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return null
  }

  const digits = value.replace(/[^\d]/g, '')
  if (!digits) {
    return null
  }

  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : null
}

function getKeywords(keywords: string[] | null | undefined): string[] {
  return keywords?.filter((keyword) => typeof keyword === 'string' && keyword.trim().length > 0) ?? []
}

function getApolloShortDescription(org: ApolloOrganizationResult): string | null {
  const details = [
    org.organization_revenue_printed ? `Revenue: ${org.organization_revenue_printed}` : null,
    org.founded_year ? `Founded: ${org.founded_year}` : null,
  ].filter(Boolean)

  return details.length > 0 ? details.join(' · ') : null
}
