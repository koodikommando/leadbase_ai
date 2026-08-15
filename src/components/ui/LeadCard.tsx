'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ScoreBadge from '@/components/ui/ScoreBadge'
import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadStatus } from '@/lib/types/lead'

interface LeadCardProps {
  lead: Lead
  onDelete?: (leadId: string) => Promise<void>
}

// NEW status only gets text-secondary border/text — not accent green,
// which is reserved for high-value signals
const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  new:          { color: 'var(--text-secondary)', border: '1px solid var(--text-secondary)' },
  contacted:    { color: 'var(--warning)',         border: '1px solid var(--warning)' },
  qualified:    { color: 'var(--accent)',          border: '1px solid var(--accent)' },
  disqualified: { color: 'var(--danger)',          border: '1px solid var(--danger)' },
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'var(--text-dim)',
  contacted: 'var(--warning)',
  qualified: 'var(--accent)',
  disqualified: 'var(--danger)',
}

export default function LeadCard({ lead, onDelete }: LeadCardProps) {
  const [currentStatus, setCurrentStatus] = useState(lead.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const company = lead.company
  const status = STATUS_STYLES[currentStatus] ?? { color: 'var(--text-dim)', border: '1px solid var(--text-dim)' }

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === currentStatus || updatingStatus) return
    setUpdatingStatus(true)
    setCurrentStatus(newStatus)

    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', lead.id)

    if (error) {
      setCurrentStatus(lead.status)
      console.error('[LeadCard] Status update failed:', error)
    }
    setUpdatingStatus(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] as [number, number, number, number] }}
      className="flex items-start gap-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid #333333',
        padding: '14px 18px',
      }}
    >
      {/* Score badge */}
      <div className="shrink-0" style={{ paddingTop: 2 }}>
        <ScoreBadge score={lead.lead_score} icpFit={lead.icp_fit} size="md" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Company name + status pill */}
        <div className="flex items-baseline gap-3 mb-1">
          <h3
            className="font-heading"
            style={{
              fontSize: 22,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
            }}
          >
            {company?.name ?? '—'}
          </h3>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              padding: '2px 6px',
              color: status.color,
              border: status.border,
              textTransform: 'uppercase',
            }}
          >
            {currentStatus}
          </span>
        </div>

        {/* Metadata line — all on one row, 2ch gaps, distinct weights */}
        <div
          className="flex flex-wrap items-center mb-2"
          style={{ gap: '0', columnGap: '2ch', rowGap: '2px' }}
        >
          {company?.industry && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-dim)' }}>
              {company.industry}
            </span>
          )}
          {company?.city && company?.country && (
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)' }}>
              {company.city}, {company.country}
            </span>
          )}
          {company?.employee_count && (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
              <span style={{ color: 'var(--text-primary)' }}>
                {company.employee_count.toLocaleString()}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 10, letterSpacing: '0.08em' }}>
                {' '}EMP
              </span>
            </span>
          )}
          {company?.domain && (
            <a
              href={`https://${company.domain}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
            >
              {company.domain}
            </a>
          )}
        </div>

        {/* Short summary */}
        {lead.ai_summary && (
          <p
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              margin: '0 0 12px',
            }}
          >
            {lead.ai_summary}
          </p>
        )}

        {/* Signals and concerns row */}
        {((lead.signals && lead.signals.length > 0) ||
          (lead.concerns && lead.concerns.length > 0)) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: lead.concerns && lead.concerns.length > 0
                ? '1fr 1fr'
                : '1fr',
              gap: '16px',
              margin: '0 0 12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--bg-elevated)',
            }}
          >
            {/* Signals */}
            {lead.signals && lead.signals.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '9px',
                    color: 'var(--accent)',
                    letterSpacing: '0.12em',
                    margin: '0 0 8px',
                  }}
                >
                  WHY IT FITS
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {lead.signals.map((signal, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        paddingLeft: '12px',
                        position: 'relative',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: 'var(--accent)',
                        }}
                      >
                        +
                      </span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns */}
            {lead.concerns && lead.concerns.length > 0 && (
              <div>
                <p
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '9px',
                    color: 'var(--danger)',
                    letterSpacing: '0.12em',
                    margin: '0 0 8px',
                  }}
                >
                  WATCH OUT
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {lead.concerns.map((concern, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: 'DM Mono, monospace',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.6',
                        paddingLeft: '12px',
                        position: 'relative',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: 'var(--danger)',
                        }}
                      >
                        −
                      </span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '6px',
          margin: '12px 0',
          paddingTop: '12px',
          borderTop: '1px solid var(--bg-elevated)',
        }}>
          {(['new', 'contacted', 'qualified', 'disqualified'] as LeadStatus[])
            .map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus}
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  background: currentStatus === s
                    ? STATUS_COLORS[s]
                    : 'transparent',
                  color: currentStatus === s
                    ? '#000000'
                    : 'var(--text-dim)',
                  border: currentStatus === s
                    ? `1px solid ${STATUS_COLORS[s]}`
                    : '1px solid var(--border)',
                  cursor: updatingStatus ? 'not-allowed' : 'pointer',
                  opacity: updatingStatus && currentStatus !== s ? 0.5 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {s}
              </button>
            ))}
        </div>

        {/* Outreach angle — inline ANGLE label, no italic, bg-elevated */}
        {lead.outreach_angle && (
          <div
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderLeft: '2px solid var(--accent)',
              padding: '8px 12px 8px 16px',
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'inline',
                marginRight: 8,
              }}
            >
              ANGLE
            </span>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
              }}
            >
              {lead.outreach_angle}
            </span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right" style={{ paddingTop: 2 }}>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: 'var(--text-dim)',
            whiteSpace: 'nowrap',
          }}
        >
          {new Date(lead.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: '2-digit',
          })}
        </p>
        {onDelete && (
          <button
            type="button"
            onClick={() => void onDelete(lead.id)}
            style={{
              marginTop: 12,
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              letterSpacing: '0.12em',
              padding: '5px 8px',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = 'var(--danger)'
              event.currentTarget.style.color = 'var(--danger)'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = 'var(--border)'
              event.currentTarget.style.color = 'var(--text-dim)'
            }}
          >
            DELETE
          </button>
        )}
      </div>
    </motion.div>
  )
}
