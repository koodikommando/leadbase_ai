'use client'

import { motion } from 'framer-motion'

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0, 0, 1] }}
      className="flex flex-col items-center justify-center h-64 select-none"
    >
      <div
        className="px-8 py-6 text-center"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          maxWidth: 480,
          width: '100%',
        }}
      >
        {/* Scanline header */}
        <div
          className="mb-4 pb-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            SYS
          </span>
          <span className="text-xs" style={{ color: 'var(--border)' }}>
            ────
          </span>
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            TERMINAL OUTPUT
          </span>
        </div>

        <p
          className="text-sm mb-1"
          style={{ color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}
        >
          &gt; AWAITING QUERY
          <BlinkingCursor />
        </p>
        <p
          className="text-xs mt-3"
          style={{ color: 'var(--text-dim)' }}
        >
          ENTER COMPANY NAME, DOMAIN, OR INDUSTRY TO BEGIN SEARCH
        </p>
      </div>
    </motion.div>
  )
}

function BlinkingCursor() {
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
