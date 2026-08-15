'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type AuthMode = 'signIn' | 'signUp'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignIn(): Promise<void> {
    setMode('signIn')
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/leads')
  }

  async function handleSignUp(): Promise<void> {
    setMode('signUp')
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Check your email to confirm your account')
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 100,
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
        style={{
          width: 400,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          padding: 28,
        }}
      >
        <h1
          className="font-heading"
          style={{ color: 'var(--accent)', fontSize: 32, letterSpacing: '0.1em' }}
        >
          LEADBASE
        </h1>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.1em',
            color: 'var(--text-dim)',
            marginTop: 4,
          }}
        >
          INTELLIGENCE SYSTEM v0.1
        </p>

        <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '22px 0' }} />

        <div className="flex flex-col" style={{ gap: 12 }}>
          <AuthInput
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="EMAIL"
            disabled={isSubmitting}
          />
          <AuthInput
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="PASSWORD"
            disabled={isSubmitting}
          />

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSubmitting || !email || !password}
            style={{
              height: 48,
              width: '100%',
              marginTop: 4,
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              backgroundColor:
                isSubmitting || !email || !password ? 'var(--bg-elevated)' : 'var(--accent)',
              color: isSubmitting || !email || !password ? 'var(--text-dim)' : '#000000',
              border: 'none',
              cursor: isSubmitting || !email || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting && mode === 'signIn' ? 'SIGNING IN' : 'SIGN IN'}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={isSubmitting || !email || !password}
            style={{
              height: 32,
              width: '100%',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: 'transparent',
              color: 'var(--text-dim)',
              border: 'none',
              cursor: isSubmitting || !email || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting && mode === 'signUp' ? 'CREATING ACCOUNT' : 'CREATE ACCOUNT'}
          </button>

          {error ? (
            <p style={{ color: 'var(--danger)', fontSize: 11, lineHeight: 1.6 }}>{error}</p>
          ) : null}

          {message ? (
            <p style={{ color: 'var(--accent)', fontSize: 11, lineHeight: 1.6 }}>{message}</p>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

interface AuthInputProps {
  type: 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled: boolean
}

function AuthInput({
  type,
  value,
  onChange,
  placeholder,
  disabled,
}: AuthInputProps) {
  const [focused, setFocused] = useState(false)

  return (
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
      {focused ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,255,0,0.015) 2px, rgba(200,255,0,0.015) 4px)',
          }}
        />
      ) : null}

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
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 14,
          color: 'var(--text-primary)',
          caretColor: 'var(--accent)',
          letterSpacing: '0.02em',
        }}
      />
    </div>
  )
}
