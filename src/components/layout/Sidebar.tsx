'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/leads', label: 'LEADS', icon: '◈' },
  { href: '/search', label: 'SEARCH', icon: '⊹' },
  { href: '/settings', label: 'SETTINGS', icon: '⚙' },
] as const

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNavClick = () => {
    if (isMobile) setIsOpen(false)
  }

  async function handleSignOut(): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 199,
          }}
        />
      )}

      {isMobile && (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 201,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--accent)',
            width: '36px',
            height: '36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label="Toggle menu"
        >
          <span
            style={{
              display: 'block',
              width: '16px',
              height: '1.5px',
              background: 'var(--accent)',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '16px',
              height: '1.5px',
              background: 'var(--accent)',
              opacity: isOpen ? 0 : 1,
              transition: 'opacity 0.2s',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '16px',
              height: '1.5px',
              background: 'var(--accent)',
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
            }}
          />
        </button>
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 200,
          transform: isMobile && !isOpen ? 'translateX(-240px)' : 'translateX(0)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Wordmark */}
        <div
          className="px-5 py-6"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h1
            className="font-heading text-2xl tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            LEADBASE
          </h1>
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.08em',
              color: 'var(--text-dim)',
              marginTop: 4,
            }}
          >
            INTELLIGENCE SYSTEM v0.1
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <NavItem
                key={item.href}
                item={item}
                active={active}
                onClick={handleNavClick}
              />
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-5 py-4"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}
        >
          <button
            type="button"
            onClick={handleSignOut}
            className="transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              marginBottom: 14,
              padding: 0,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = 'var(--danger)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            SIGN OUT
          </button>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--text-dim)' }}>
            SYS:ONLINE
          </p>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--accent-dim)', marginTop: 2 }}>
            ● CONNECTED
          </p>
        </div>
      </aside>
    </>
  )
}

function NavItem({
  item,
  active,
  onClick,
}: {
  item: { href: string; label: string; icon: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15, ease: [0.25, 0, 0, 1] }}
    >
      <Link
        href={item.href}
        onClick={onClick}
        className="flex items-center gap-3 px-5 py-3 transition-colors"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: '0.1em',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          backgroundColor: active ? 'var(--bg-elevated)' : 'transparent',
          borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
        }}
      >
        <span style={{ fontSize: 13, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
        {item.label}
      </Link>
    </motion.div>
  )
}
