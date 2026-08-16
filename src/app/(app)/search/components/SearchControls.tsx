'use client'

import { motion } from 'framer-motion'
import SearchBar from '@/components/ui/SearchBar'

const EASE = [0.25, 0, 0, 1] as [number, number, number, number]

interface IcpProfilePreview {
  description: string
  industries: string[]
}

export default function SearchControls({
  onSearch,
  onIcpSearch,
  isLoading,
  icpSearching,
  icpProfile,
}: {
  onSearch: (query: string) => void
  onIcpSearch: () => void
  isLoading: boolean
  icpSearching: boolean
  icpProfile: IcpProfilePreview | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05, ease: EASE }}
      style={{ marginBottom: 16 }}
    >
      <SearchBar
        onSearch={onSearch}
        isLoading={isLoading || icpSearching}
        placeholder="SEARCH BY COMPANY NAME"
      />

      {/* OR divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '8px 0',
      }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '9px',
          color: 'var(--text-dim)',
          letterSpacing: '0.1em',
        }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* ICP search button */}
      <button
        onClick={onIcpSearch}
        disabled={icpSearching || !icpProfile}
        style={{
          width: '100%',
          height: '40px',
          background: 'transparent',
          border: icpProfile
            ? '1.5px solid var(--accent)'
            : '1px solid var(--border)',
          color: icpProfile ? 'var(--accent)' : 'var(--text-dim)',
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          cursor: icpProfile ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {icpSearching
          ? '⟳ SCANNING APOLLO FOR ICP MATCHES...'
          : !icpProfile
            ? 'NO ICP PROFILE — GENERATE ONE IN SETTINGS'
            : '⟳ FIND LEADS MATCHING YOUR ICP'}
      </button>

      {/* Active ICP label */}
      {icpProfile && (
        <p style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '9px',
          color: 'var(--text-dim)',
          letterSpacing: '0.08em',
          margin: '4px 0 0',
          textTransform: 'uppercase',
        }}>
          ACTIVE ICP: {icpProfile.industries.slice(0, 3).join(' · ')}
          {icpProfile.industries.length > 3 ? ` +${icpProfile.industries.length - 3} more` : ''}
        </p>
      )}
    </motion.div>
  )
}
