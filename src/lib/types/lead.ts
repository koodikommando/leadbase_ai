export interface Company {
  id: string
  apollo_id: string | null
  name: string
  domain: string | null
  industry: string | null
  employee_count: number | null
  country: string | null
  city: string | null
  linkedin_url: string | null
  raw_apollo: Record<string, unknown> | null
  created_at: string
}

export type IcpFit = 'high' | 'medium' | 'low'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified'

export interface Lead {
  id: string
  company_id: string
  lead_score: number
  icp_fit: IcpFit
  outreach_angle: string | null
  status: LeadStatus
  ai_summary: string | null
  signals: string[] | null
  concerns: string[] | null
  created_at: string
  // Joined
  company?: Company
}

export interface Client {
  id: string
  name: string
  domain: string | null
  industry: string | null
  employee_count: number | null
  country: string | null
  city: string | null
  is_client: true
  client_notes: string | null
  created_at: string
}

export interface IcpProfile {
  id: string
  name: string
  description: string | null
  industries: string[]
  size_range: string | null
  signals: string[]
  anti_signals: string[]
  client_count: number
  generated_at: string | null
  criteria: Record<string, unknown> | null
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string | null
  what_we_sell: string | null
  who_we_sell_to: string | null
  typical_deal_size: string | null
  problem_we_solve: string | null
  updated_at: string
}

export interface ClientFormData {
  name: string
  domain: string
  industry: string
  employee_count: string
  country: string
  city: string
  client_notes: string
}

export interface EnrichmentResult {
  lead_score: number
  icp_fit: IcpFit
  ai_summary: string
  signals: string[]
  concerns: string[]
  outreach_angle: string
}
