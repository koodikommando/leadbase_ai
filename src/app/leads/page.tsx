'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import LeadCard from '@/components/ui/LeadCard'
import { createClient } from '@/lib/supabase/client'
import type { Company, Lead } from '@/lib/types/lead'
import { getErrorMessage } from '@/lib/utils'

type LeadRow = Omit<Lead, 'company'> & {
  company: Company | Company[] | null
}

const ICP_FIT_ORDER = { high: 0, medium: 1, low: 2 }

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadLeads() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('leads')
          .select(`
            id,
            company_id,
            lead_score,
            icp_fit,
            outreach_angle,
            status,
            ai_summary,
            signals,
            concerns,
            created_at,
            company:companies (
              id,
              apollo_id,
              name,
              domain,
              industry,
              employee_count,
              country,
              city,
              linkedin_url,
              raw_apollo,
              created_at
            )
          `)
          .order('lead_score', { ascending: false })

        if (error) {
          throw error
        }

        if (!isMounted) {
          return
        }

        setLeads(((data ?? []) as LeadRow[]).map(normalizeLeadRow))
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error))
          setLeads([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadLeads()

    return () => {
      isMounted = false
    }
  }, [])

  const sorted = useMemo(
    () =>
      [...leads].sort(
        (a, b) =>
          ICP_FIT_ORDER[a.icp_fit] - ICP_FIT_ORDER[b.icp_fit] ||
          b.lead_score - a.lead_score
      ),
    [leads]
  )

  const highCount = sorted.filter((l) => l.icp_fit === 'high').length
  const avgScore = sorted.length
    ? Math.round(sorted.reduce((s, l) => s + l.lead_score, 0) / sorted.length)
    : 0

  async function handleDeleteLead(leadId: string): Promise<void> {
    setErrorMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setLeads((current) => current.filter((lead) => lead.id !== leadId))
  }

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] as [number, number, number, number] }}
        style={{ marginBottom: 20 }}
      >
        <h1
          className="font-heading"
          style={{ fontSize: 36, color: 'var(--text-primary)', letterSpacing: '0.06em' }}
        >
          SAVED LEADS
        </h1>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 2 }}>
          AI-ENRICHED · SORTED BY ICP FIT
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05, ease: [0.25, 0, 0, 1] as [number, number, number, number] }}
        className="flex"
        style={{
          gap: 24,
          marginBottom: 20,
          padding: '10px 16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <Stat label="TOTAL LEADS" value={sorted.length.toString()} />
        <StatDivider />
        <Stat label="HIGH ICP" value={highCount.toString()} accent />
        <StatDivider />
        <Stat label="AVG SCORE" value={avgScore.toString()} mono />
        <StatDivider />
        <Stat label="STATUS" value={errorMessage ? 'ERROR' : isLoading ? 'LOADING' : 'LIVE DATA'} dim={!!errorMessage} />
      </motion.div>

      {isLoading ? (
        <SystemMessage title="LOADING LEADS" body="QUERYING SUPABASE FOR SAVED AI-ENRICHED LEADS..." />
      ) : errorMessage ? (
        <SystemMessage title="SUPABASE READ FAILED" body={errorMessage} tone="danger" />
      ) : sorted.length === 0 ? (
        <SystemMessage title="NO SAVED LEADS" body="ENRICH A COMPANY FROM SEARCH TO CREATE YOUR FIRST SAVED LEAD." />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col"
          style={{ gap: 2 }}
        >
          {sorted.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDelete={handleDeleteLead} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

function normalizeLeadRow(row: LeadRow): Lead {
  const company = Array.isArray(row.company) ? row.company[0] : row.company

  return {
    id: row.id,
    company_id: row.company_id,
    lead_score: row.lead_score,
    icp_fit: row.icp_fit,
    outreach_angle: row.outreach_angle,
    status: row.status,
    ai_summary: row.ai_summary,
    signals: row.signals,
    concerns: row.concerns,
    created_at: row.created_at,
    company: company ?? undefined,
  }
}

function SystemMessage({
  title,
  body,
  tone = 'muted',
}: {
  title: string
  body: string
  tone?: 'muted' | 'danger'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] as [number, number, number, number] }}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${tone === 'danger' ? 'var(--danger)' : 'var(--border)'}`,
        padding: '20px 24px',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <p
        style={{
          color: tone === 'danger' ? 'var(--danger)' : 'var(--accent)',
          fontSize: 11,
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
        {body}
      </p>
    </motion.div>
  )
}

function Stat({
  label,
  value,
  accent,
  mono,
  dim,
}: {
  label: string
  value: string
  accent?: boolean
  mono?: boolean
  dim?: boolean
}) {
  return (
    <div>
      <p
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          letterSpacing: '0.1em',
          color: 'var(--text-dim)',
          marginBottom: 3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20,
          lineHeight: 1,
          color: accent
            ? 'var(--accent)'
            : dim
            ? 'var(--warning)'
            : 'var(--text-primary)',
          letterSpacing: mono ? '0.04em' : '0',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function StatDivider() {
  return (
    <div
      className="w-px self-stretch"
      style={{ backgroundColor: 'var(--border)' }}
    />
  )
}
