'use client'

import type { ApolloOrganization } from '@/lib/types/apollo'
import type { EnrichState } from '../useSearchData'

export default function OrgCard({
  org,
  enrichState,
  onEnrich,
}: {
  org: ApolloOrganization
  enrichState: EnrichState
  onEnrich: (org: ApolloOrganization) => void
}) {
  const isSaving = enrichState === 'saving'
  const isSaved = enrichState === 'saved'
  const isErrored = enrichState === 'error'

  return (
    <div
      style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid #333333',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between" style={{ gap: 16, marginBottom: 8 }}>
        <div className="min-w-0">
          <h3
            className="font-heading"
            style={{
              fontSize: 20,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {org.name}
          </h3>
          {/* Inline meta */}
          <div className="flex flex-wrap items-center" style={{ gap: '2ch', fontSize: 12 }}>
            {org.website_url && (
              <a
                href={org.website_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)', fontFamily: "'DM Mono', monospace", textDecoration: 'none' }}
              >
                {org.website_url.replace('https://', '')}
              </a>
            )}
            {org.city && org.country && (
              <span style={{ color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}>
                {org.city}, {org.country}
              </span>
            )}
            {org.industry && (
              <span style={{ color: 'var(--text-dim)', fontFamily: "'DM Mono', monospace" }}>
                {org.industry}
              </span>
            )}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
              <span style={{ color: 'var(--text-primary)' }}>
                {org.estimated_num_employees?.toLocaleString() ?? '—'}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 10, letterSpacing: '0.08em' }}>
                {' '}EMP
              </span>
            </span>
          </div>
        </div>

        {/* Enrich button */}
        <button
          className="shrink-0"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.08em',
            padding: '5px 12px',
            backgroundColor: 'transparent',
            color: isErrored ? 'var(--danger)' : isSaved ? 'var(--text-secondary)' : 'var(--accent)',
            border: `1px solid ${isErrored ? 'var(--danger)' : isSaved ? 'var(--text-secondary)' : 'var(--accent)'}`,
            cursor: isSaving || isSaved ? 'default' : 'pointer',
            opacity: isSaving ? 0.65 : 1,
          }}
          disabled={isSaving || isSaved}
          onClick={() => onEnrich(org)}
        >
          {isSaving ? 'SAVING...' : isSaved ? 'SAVED' : isErrored ? 'RETRY' : '+ ENRICH'}
        </button>
      </div>

      {/* Description */}
      {org.short_description && (
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: '90ch',
            marginBottom: 10,
          }}
        >
          {org.short_description}
        </p>
      )}

      {/* LinkedIn */}
      {org.linkedin_url && (
        <div style={{ marginBottom: 10 }}>
          <a
            href={org.linkedin_url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--accent-dim)',
              letterSpacing: '0.04em',
            }}
          >
            LINKEDIN →
          </a>
        </div>
      )}

      {/* Tech tags */}
      {org.technology_names.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 4 }}>
          {org.technology_names.slice(0, 8).map((tech) => (
            <span
              key={tech}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                padding: '2px 6px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid #333333',
                color: 'var(--text-dim)',
                letterSpacing: '0.04em',
              }}
            >
              {tech}
            </span>
          ))}
          {org.technology_names.length > 8 && (
            <span style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 4px' }}>
              +{org.technology_names.length - 8}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
