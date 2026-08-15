import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

interface SaveClientInput {
  name: string
  domain?: string
  industry?: string
  employee_count?: number
  country?: string
  city?: string
  client_notes?: string
}

interface CompanyPayload {
  apollo_id: null
  name: string
  domain: string | null
  industry: string | null
  employee_count: number | null
  country: string | null
  city: string | null
  client_notes: string | null
  user_id: string
  is_client: true
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const input = await req.json() as SaveClientInput
    const name = input.name?.trim()

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'name is required' }),
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase service credentials not configured' }),
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

    const domain = normalizeString(input.domain)
    const payload: CompanyPayload = {
      apollo_id: null,
      name,
      domain,
      industry: normalizeString(input.industry),
      employee_count: normalizeEmployeeCount(input.employee_count),
      country: normalizeString(input.country),
      city: normalizeString(input.city),
      client_notes: normalizeString(input.client_notes),
      user_id: user.id,
      is_client: true,
    }

    if (domain) {
      const { data: existingClient, error: lookupError } = await supabase
        .from('companies')
        .select('id')
        .eq('domain', domain)
        .eq('user_id', user.id)
        .maybeSingle()

      if (lookupError) {
        console.error('[save-client] lookup error:', lookupError)
        return new Response(
          JSON.stringify({ error: 'Database lookup failed', detail: lookupError.message }),
          { status: 500, headers: CORS_HEADERS }
        )
      }

      if (existingClient?.id) {
        const { data: client, error: updateError } = await supabase
          .from('companies')
          .update(payload)
          .eq('id', existingClient.id)
          .select('*')
          .single()

        if (updateError) {
          console.error('[save-client] update error:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update client', detail: updateError.message }),
            { status: 500, headers: CORS_HEADERS }
          )
        }

        return new Response(JSON.stringify({ success: true, client }), {
          status: 200,
          headers: CORS_HEADERS,
        })
      }
    }

    const { data: client, error: insertError } = await supabase
      .from('companies')
      .insert(payload)
      .select('*')
      .single()

    if (insertError) {
      console.error('[save-client] insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save client', detail: insertError.message }),
        { status: 500, headers: CORS_HEADERS }
      )
    }

    return new Response(JSON.stringify({ success: true, client }), {
      status: 200,
      headers: CORS_HEADERS,
    })
  } catch (error) {
    console.error('[save-client] unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    )
  }
})

function normalizeString(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function normalizeEmployeeCount(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return Math.max(0, Math.round(value))
}
