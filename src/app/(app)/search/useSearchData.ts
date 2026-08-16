import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ApolloOrganization, ApolloSearchResponse } from '@/lib/types/apollo'
import type { EnrichmentResult } from '@/lib/types/lead'
import { getErrorMessage } from '@/lib/utils'

export type EnrichState = 'idle' | 'saving' | 'saved' | 'error'
export type SearchMode = 'manual' | 'icp'

interface IcpProfilePreview {
  description: string
  industries: string[]
}

interface IcpSearchResponse extends ApolloSearchResponse {
  filters_used?: Record<string, unknown>
}

interface SaveEnrichedLeadResponse {
  success: boolean
  lead_id: string
  company_id: string
  enrichment: EnrichmentResult
}

export function useSearchData() {
  const [results, setResults] = useState<ApolloOrganization[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [icpSearching, setIcpSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [enrichStateByOrg, setEnrichStateByOrg] = useState<Record<string, EnrichState>>({})
  const [icpProfile, setIcpProfile] = useState<IcpProfilePreview | null>(null)
  const [searchMode, setSearchMode] = useState<SearchMode>('manual')
  const [filtersUsed, setFiltersUsed] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadIcpProfile() {
      const supabase = createClient()
      const { data: icp } = await supabase
        .from('icp_profiles')
        .select('description, industries')
        .eq('name', 'Default ICP')
        .maybeSingle<IcpProfilePreview>()

      if (isMounted && icp) {
        setIcpProfile(icp)
      }
    }

    void loadIcpProfile()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSearch(q: string) {
    setSearchMode('manual')
    setFiltersUsed(null)
    setQuery(q)
    setIsLoading(true)
    setErrorMessage(null)
    setResults(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke<ApolloSearchResponse>(
        'apollo-search',
        { body: { query: q } }
      )

      if (error) {
        throw error
      }

      setResults(data?.organizations ?? [])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleIcpSearch() {
    setIcpSearching(true)
    setResults([])
    setErrorMessage(null)
    setSearchMode('icp')
    setFiltersUsed(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke<IcpSearchResponse>('icp-search')

      if (error) {
        throw error
      }

      setResults(data?.organizations ?? [])
      setFiltersUsed(data?.filters_used ?? null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'ICP search failed — check that your ICP profile is generated'
      )
    } finally {
      setIcpSearching(false)
    }
  }

  async function handleEnrich(org: ApolloOrganization) {
    setErrorMessage(null)
    setEnrichStateByOrg((current) => ({ ...current, [org.id]: 'saving' }))

    try {
      const supabase = createClient()
      const { data, error } = await supabase.functions.invoke<SaveEnrichedLeadResponse>(
        'save-enriched-lead',
        { body: { org } }
      )

      if (error) {
        throw error
      }

      if (!data?.success) {
        throw new Error('Lead save failed')
      }

      setEnrichStateByOrg((current) => ({ ...current, [org.id]: 'saved' }))
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      setEnrichStateByOrg((current) => ({ ...current, [org.id]: 'error' }))
    }
  }

  return {
    results,
    isLoading,
    icpSearching,
    query,
    errorMessage,
    enrichStateByOrg,
    icpProfile,
    searchMode,
    filtersUsed,
    handleSearch,
    handleIcpSearch,
    handleEnrich,
  }
}
