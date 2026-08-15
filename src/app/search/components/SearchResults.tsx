'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ApolloOrganization } from '@/lib/types/apollo'
import type { EnrichState, SearchMode } from '../useSearchData'
import { LoadingState, TerminalEmptyState } from './EmptyStates'
import OrgCard from './OrgCard'

const EASE = [0.25, 0, 0, 1] as [number, number, number, number]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE },
  },
}

export default function SearchResults({
  query,
  results,
  searchMode,
  filtersUsed,
  errorMessage,
  isLoading,
  icpSearching,
  enrichStateByOrg,
  onEnrich,
}: {
  query: string
  results: ApolloOrganization[] | null
  searchMode: SearchMode
  filtersUsed: Record<string, unknown> | null
  errorMessage: string | null
  isLoading: boolean
  icpSearching: boolean
  enrichStateByOrg: Record<string, EnrichState>
  onEnrich: (org: ApolloOrganization) => void
}) {
  return (
    <>
      {/* Status bar */}
      {query && (
        <div
          className="flex items-center"
          style={{ gap: 16, marginBottom: 16, fontSize: 11, color: 'var(--text-dim)' }}
        >
          <span>
            QUERY:{' '}
            <span style={{ color: 'var(--accent)' }}>&quot;{query}&quot;</span>
          </span>
          {results && (
            <span>
              RESULTS:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{results.length}</span>
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              fontSize: 10,
              letterSpacing: '0.08em',
              borderLeft: '2px solid var(--warning)',
              color: 'var(--warning)',
            }}
          >
            EDGE FUNCTION
          </span>
        </div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            backgroundColor: 'var(--bg-surface)',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.04em',
          }}
        >
          ERROR: {errorMessage}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingState key="loading" />
        ) : icpSearching ? (
          <LoadingState key="icp-loading" label="SCANNING APOLLO FOR ICP MATCHES" />
        ) : results === null ? (
          <TerminalEmptyState key="empty" />
        ) : (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col"
            style={{ gap: 2 }}
          >
            {results.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '16px 0 8px',
              }}>
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.1em',
                }}>
                  {searchMode === 'icp'
                    ? `ICP MATCH · ${results.length} COMPANIES FOUND`
                    : `QUERY: "${query}" · RESULTS: ${results.length}`}
                </span>
                {searchMode === 'icp' && filtersUsed && (
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '9px',
                    color: 'var(--text-dim)',
                  }}>
                    INDUSTRIES: {getFilterIndustries(filtersUsed)}
                  </span>
                )}
              </div>
            )}
            {results.map((org) => (
              <motion.div key={org.id} variants={itemVariants} layout>
                <OrgCard
                  org={org}
                  enrichState={enrichStateByOrg[org.id] ?? 'idle'}
                  onEnrich={onEnrich}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getFilterIndustries(filtersUsed: Record<string, unknown>): string {
  const industries = filtersUsed.industries
  return Array.isArray(industries)
    ? industries.filter((industry) => typeof industry === 'string').join(', ')
    : ''
}
