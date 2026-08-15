'use client'

import type { Client, ClientFormData } from '@/lib/types/lead'
import { Field, TextAreaField } from './FormFields'
import {
  emptyCellStyle,
  primaryButtonStyle,
  statusStyle,
  tableCellStyle,
  tableHeaderStyle,
} from './styles'

export default function ClientBaseSection({
  clients,
  formData,
  updateField,
  isAdding,
  message,
  errorMessage,
  isLoading,
  onAddClient,
  onDeleteClient,
}: {
  clients: Client[]
  formData: ClientFormData
  updateField: (field: keyof ClientFormData, value: string) => void
  isAdding: boolean
  message: string | null
  errorMessage: string | null
  isLoading: boolean
  onAddClient: () => void
  onDeleteClient: (clientId: string) => void
}) {
  return (
    <section>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="font-heading" style={{ fontSize: 28, color: 'var(--text-primary)' }}>
          CLIENT BASE
        </h1>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'var(--text-dim)',
            letterSpacing: '0.08em',
          }}
        >
          {clients.length} CLIENTS ADDED
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Field
          label="COMPANY NAME*"
          value={formData.name}
          onChange={(value) => updateField('name', value)}
          style={{ gridColumn: '1 / -1' }}
        />
        <Field
          label="DOMAIN"
          value={formData.domain}
          onChange={(value) => updateField('domain', value)}
          style={{ gridColumn: 'span 2' }}
        />
        <Field
          label="INDUSTRY"
          value={formData.industry}
          onChange={(value) => updateField('industry', value)}
          style={{ gridColumn: 'span 2' }}
        />
        <Field
          label="EMPLOYEES"
          value={formData.employee_count}
          type="number"
          onChange={(value) => updateField('employee_count', value)}
        />
        <Field
          label="COUNTRY"
          value={formData.country}
          onChange={(value) => updateField('country', value)}
        />
        <Field
          label="CITY"
          value={formData.city}
          onChange={(value) => updateField('city', value)}
        />
        <div />
        <TextAreaField
          label="NOTES (WHY ARE THEY A GOOD CLIENT?)"
          value={formData.client_notes}
          onChange={(value) => updateField('client_notes', value)}
          style={{ gridColumn: '1 / -1' }}
        />
      </div>

      <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
        <button
          type="button"
          onClick={onAddClient}
          disabled={isAdding}
          style={primaryButtonStyle(40, '0 24px', isAdding)}
        >
          {isAdding ? 'ADDING...' : 'ADD CLIENT'}
        </button>
        {message && <span style={statusStyle('var(--accent)')}>{message}</span>}
        {errorMessage && <span style={statusStyle('var(--danger)')}>ERROR: {errorMessage}</span>}
      </div>

      <div style={{ marginTop: 28, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['NAME', 'INDUSTRY', 'EMPLOYEES', 'LOCATION', 'NOTES', 'DELETE'].map((heading) => (
                <th key={heading} style={tableHeaderStyle}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={emptyCellStyle}>
                  LOADING CLIENTS...
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={6} style={emptyCellStyle}>
                  NO CLIENTS ADDED
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: '1px solid var(--bg-elevated)', height: 44 }}>
                  <td style={{ ...tableCellStyle, color: 'var(--text-primary)' }}>{client.name}</td>
                  <td style={tableCellStyle}>{client.industry ?? '—'}</td>
                  <td style={tableCellStyle}>{client.employee_count?.toLocaleString() ?? '—'}</td>
                  <td style={tableCellStyle}>{formatLocation(client)}</td>
                  <td style={tableCellStyle}>{client.client_notes ?? '—'}</td>
                  <td style={tableCellStyle}>
                    <button
                      type="button"
                      onClick={() => onDeleteClient(client.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--danger)',
                        fontSize: 18,
                        cursor: 'pointer',
                      }}
                      aria-label={`Delete ${client.name}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatLocation(client: Client): string {
  return [client.city, client.country].filter(Boolean).join(', ') || '—'
}
