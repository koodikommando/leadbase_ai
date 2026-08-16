'use client'

import { motion } from 'framer-motion'

const EASE = [0.25, 0, 0, 1] as [number, number, number, number]

// Full-width terminal-style empty state, left-aligned
export function TerminalEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: EASE }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid #333333',
        padding: '20px 24px',
        width: '100%',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {/* Top rule */}
      <div
        className="flex items-center"
        style={{ gap: 12, marginBottom: 16, color: 'var(--text-dim)', fontSize: 11 }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 10, letterSpacing: '0.08em' }}>
          SYS:ONLINE
        </span>
        <span style={{ flex: 1, borderTop: '1px solid #333333', height: 0, display: 'block' }} />
      </div>

      {/* Prompt line */}
      <p style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>
        {'> '}AWAITING QUERY
        <BlinkingCursor />
      </p>

      {/* Context lines */}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <p>MANUAL SEARCH ACCEPTS: COMPANY NAME</p>
        <p>ICP DISCOVERY SCANS APOLLO USING YOUR DEFAULT ICP PROFILE</p>
        <p>RESULTS POWERED BY APOLLO · AI ENRICHMENT VIA CLAUDE</p>
      </div>

      {/* Bottom rule */}
      <div style={{ borderTop: '1px solid #333333', marginTop: 16 }} />
    </motion.div>
  )
}

export function BlinkingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ color: 'var(--accent)' }}
    >
      _
    </motion.span>
  )
}

export function LoadingState({ label = 'SCANNING APOLLO' }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col"
      style={{ gap: 2 }}
    >
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          style={{
            height: 80,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid #333333',
          }}
        />
      ))}
      <p
        style={{
          fontSize: 11,
          color: 'var(--text-dim)',
          textAlign: 'center',
          marginTop: 8,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.06em',
        }}
      >
        {label}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          ...
        </motion.span>
      </p>
    </motion.div>
  )
}
