'use client'

import { useState } from 'react'
import { inputStyle } from './styles'

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  style,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  style?: React.CSSProperties
}) {
  const [focused, setFocused] = useState(false)

  return (
    <label style={style}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle(focused)}
      />
    </label>
  )
}

export function TextAreaField({
  label,
  value,
  onChange,
  style,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  style?: React.CSSProperties
}) {
  const [focused, setFocused] = useState(false)

  return (
    <label style={style}>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle(focused), height: 'auto', minHeight: 88, paddingTop: 10, resize: 'vertical' }}
      />
    </label>
  )
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        marginBottom: 6,
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'var(--text-dim)',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </span>
  )
}
