'use client'

import { motion } from 'framer-motion'
import SearchControls from './components/SearchControls'
import SearchResults from './components/SearchResults'
import { useSearchData } from './useSearchData'

const EASE = [0.25, 0, 0, 1] as [number, number, number, number]

export default function SearchPage() {
  const {
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
  } = useSearchData()

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
        style={{ marginBottom: 20 }}
      >
        <h1
          className="font-heading"
          style={{ fontSize: 36, color: 'var(--text-primary)', letterSpacing: '0.06em' }}
        >
          COMPANY SEARCH
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
          POWERED BY APOLLO.IO
        </p>
      </motion.div>

      <SearchControls
        onSearch={handleSearch}
        onIcpSearch={handleIcpSearch}
        isLoading={isLoading}
        icpSearching={icpSearching}
        icpProfile={icpProfile}
      />

      <SearchResults
        query={query}
        results={results}
        searchMode={searchMode}
        filtersUsed={filtersUsed}
        errorMessage={errorMessage}
        isLoading={isLoading}
        icpSearching={icpSearching}
        enrichStateByOrg={enrichStateByOrg}
        onEnrich={handleEnrich}
      />
    </div>
  )
}
