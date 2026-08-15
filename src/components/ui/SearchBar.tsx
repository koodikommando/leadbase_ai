'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

export default function SearchBar({
  onSearch,
  isLoading = false,
  placeholder = 'SEARCH COMPANIES — NAME, DOMAIN, OR INDUSTRY',
}: SearchBarProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className="flex items-center transition-all duration-200"
        style={{
          height: 48,
          backgroundColor: 'var(--bg-surface)',
          border: `2px solid ${focused ? 'var(--accent)' : '#333333'}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scanline overlay when focused */}
        {focused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,255,0,0.015) 2px, rgba(200,255,0,0.015) 4px)',
            }}
          />
        )}

        {/* Prompt glyph */}
        <span
          className="select-none shrink-0"
          style={{
            padding: '0 12px',
            fontSize: 13,
            color: focused ? 'var(--accent)' : 'var(--text-dim)',
          }}
        >
          ›
        </span>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            color: 'var(--text-primary)',
            caretColor: 'var(--accent)',
            letterSpacing: '0.02em',
            // placeholder color handled via global or inline workaround
          }}
          disabled={isLoading}
        />

        {/* Execute button — always accent fill, black text, no border-radius */}
        <button
          type="submit"
          disabled={!value.trim() || isLoading}
          style={{
            height: '100%',
            minWidth: 100,
            padding: '0 20px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            backgroundColor: !value.trim() || isLoading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: !value.trim() || isLoading ? 'var(--text-dim)' : '#000000',
            border: 'none',
            borderLeft: `1px solid ${focused ? 'var(--accent)' : '#333333'}`,
            cursor: !value.trim() || isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          {isLoading ? 'SCANNING' : 'EXECUTE'}
        </button>
      </div>
    </form>
  )
}
