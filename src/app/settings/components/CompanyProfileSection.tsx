'use client'

import type { CompanyProfile } from '@/lib/types/lead'
import { Field, TextAreaField } from './FormFields'
import { primaryButtonStyle, statusStyle } from './styles'

interface ProfileForm {
  company_name: string
  what_we_sell: string
  who_we_sell_to: string
  typical_deal_size: string
  problem_we_solve: string
}

export default function CompanyProfileSection({
  profile,
  profileForm,
  updateProfileField,
  savingProfile,
  profileSaved,
  onSave,
}: {
  profile: CompanyProfile | null
  profileForm: ProfileForm
  updateProfileField: (field: keyof ProfileForm, value: string) => void
  savingProfile: boolean
  profileSaved: boolean
  onSave: () => void
}) {
  return (
    <section>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 className="font-heading" style={{ fontSize: 28, color: 'var(--text-primary)' }}>
          COMPANY PROFILE
        </h1>
        {profile?.updated_at && (
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: 'var(--text-dim)',
              letterSpacing: '0.08em',
            }}
          >
            Last updated: {new Date(profile.updated_at).toLocaleString()}
          </span>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Field
          label="COMPANY NAME"
          value={profileForm.company_name}
          onChange={(value) => updateProfileField('company_name', value)}
          style={{ gridColumn: '1 / -1' }}
        />
        <Field
          label="WHAT YOU SELL"
          value={profileForm.what_we_sell}
          onChange={(value) => updateProfileField('what_we_sell', value)}
          placeholder="Short description of your product/service"
          style={{ gridColumn: '1 / -1' }}
        />
        <Field
          label="WHO YOU SELL TO"
          value={profileForm.who_we_sell_to}
          onChange={(value) => updateProfileField('who_we_sell_to', value)}
          placeholder="Describe your target customer type"
          style={{ gridColumn: '1 / -1' }}
        />
        <Field
          label="TYPICAL DEAL SIZE"
          value={profileForm.typical_deal_size}
          onChange={(value) => updateProfileField('typical_deal_size', value)}
          style={{ gridColumn: 'span 2' }}
        />
        <div style={{ gridColumn: 'span 2' }} />
        <TextAreaField
          label="WHAT PROBLEM DO YOU SOLVE"
          value={profileForm.problem_we_solve}
          onChange={(value) => updateProfileField('problem_we_solve', value)}
          style={{ gridColumn: '1 / -1' }}
        />
      </div>

      <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
        {profileSaved ? (
          <span style={statusStyle('var(--accent)')}>PROFILE SAVED ✓</span>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={savingProfile}
            style={primaryButtonStyle(40, '0 24px', savingProfile)}
          >
            {savingProfile ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        )}
      </div>
    </section>
  )
}
