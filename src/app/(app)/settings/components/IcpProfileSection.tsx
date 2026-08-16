'use client'

import { motion } from 'framer-motion'
import type { IcpProfile } from '@/lib/types/lead'
import { ghostButtonStyle, pillStyle, primaryButtonStyle, tableCellStyle } from './styles'

export default function IcpProfileSection({
  icpProfile,
  clientCount,
  isGenerating,
  onGenerate,
}: {
  icpProfile: IcpProfile | null
  clientCount: number
  isGenerating: boolean
  onGenerate: () => void
}) {
  return (
    <section>
      <h2 className="font-heading" style={{ fontSize: 28, color: 'var(--text-primary)', marginBottom: 20 }}>
        ICP PROFILE
      </h2>

      {!icpProfile && clientCount < 2 && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            padding: '18px 20px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'var(--text-dim)',
            textAlign: 'left',
            letterSpacing: '0.04em',
          }}
        >
          ADD AT LEAST 2 CLIENTS TO GENERATE AN ICP PROFILE
        </div>
      )}

      {!icpProfile && clientCount >= 2 && (
        <div>
          {isGenerating ? (
            <AnalyzingState />
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              style={primaryButtonStyle(44, '0 32px', false)}
            >
              GENERATE ICP FROM {clientCount} CLIENTS
            </button>
          )}
        </div>
      )}

      {icpProfile && (
        <ProfilePanel
          profile={icpProfile}
          isGenerating={isGenerating}
          onRegenerate={onGenerate}
        />
      )}
    </section>
  )
}

function AnalyzingState() {
  return (
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--accent)' }}>
      ANALYZING CLIENT PATTERNS
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        _
      </motion.span>
    </p>
  )
}

function ProfilePanel({
  profile,
  isGenerating,
  onRegenerate,
}: {
  profile: IcpProfile
  isGenerating: boolean
  onRegenerate: () => void
}) {
  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: 22 }}>
      <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 18 }}>
        <h3 className="font-heading" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
          {profile.name}
        </h3>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-dim)' }}>
          {profile.generated_at ? new Date(profile.generated_at).toLocaleString() : 'NOT GENERATED'}
        </span>
      </div>

      <p
        style={{
          borderLeft: '2px solid var(--accent)',
          paddingLeft: 16,
          marginBottom: 24,
          fontFamily: "'DM Mono', monospace",
          fontSize: 14,
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }}
      >
        {profile.description ?? 'No description available.'}
      </p>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 24 }}>
        <div>
          <SectionLabel>TARGET INDUSTRIES</SectionLabel>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {profile.industries.length > 0 ? profile.industries.map((industry) => (
              <span key={industry} style={pillStyle}>
                {industry}
              </span>
            )) : (
              <span style={tableCellStyle}>—</span>
            )}
          </div>
        </div>
        <div>
          <SectionLabel>SIZE RANGE</SectionLabel>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: 'var(--text-primary)' }}>
            {profile.size_range ?? '—'}
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 24 }}>
        <SignalList title="SIGNALS" items={profile.signals} prefix="+" color="var(--accent)" />
        <SignalList title="ANTI-SIGNALS" items={profile.anti_signals} prefix="−" color="var(--danger)" dim />
      </div>

      {isGenerating ? (
        <AnalyzingState />
      ) : (
        <button type="button" onClick={onRegenerate} style={ghostButtonStyle}>
          REGENERATE ICP
        </button>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        marginBottom: 8,
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'var(--text-dim)',
      }}
    >
      {children}
    </p>
  )
}

function SignalList({
  title,
  items,
  prefix,
  color,
  dim = false,
}: {
  title: string
  items: string[]
  prefix: string
  color: string
  dim?: boolean
}) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.8 }}>
        {items.length > 0 ? items.map((item) => (
          <p key={item}>
            <span style={{ color }}>{prefix} </span>
            <span style={{ color: dim ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{item}</span>
          </p>
        )) : (
          <p style={{ color: 'var(--text-secondary)' }}>—</p>
        )}
      </div>
    </div>
  )
}
