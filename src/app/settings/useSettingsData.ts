import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, ClientFormData, CompanyProfile, IcpProfile } from '@/lib/types/lead'
import { getErrorMessage } from '@/lib/utils'

const EMPTY_FORM: ClientFormData = {
  name: '',
  domain: '',
  industry: '',
  employee_count: '',
  country: '',
  city: '',
  client_notes: '',
}

const EMPTY_PROFILE_FORM = {
  company_name: '',
  what_we_sell: '',
  who_we_sell_to: '',
  typical_deal_size: '',
  problem_we_solve: '',
}

export function useSettingsData() {
  const [clients, setClients] = useState<Client[]>([])
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [icpProfile, setIcpProfile] = useState<IcpProfile | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      await Promise.all([fetchClients(), fetchProfile(), fetchIcpProfile()])
      setIsLoading(false)
    }

    void loadInitialData()
  }, [])

  async function fetchClients() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_client', true)
      .order('created_at', { ascending: false })
      .returns<Client[]>()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setClients(data ?? [])
  }

  async function fetchProfile() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('company_profile')
      .select('*')
      .maybeSingle<CompanyProfile>()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    const profileData = data
    setProfile(profileData)

    if (profileData) {
      setProfileForm({
        company_name: profileData.company_name ?? '',
        what_we_sell: profileData.what_we_sell ?? '',
        who_we_sell_to: profileData.who_we_sell_to ?? '',
        typical_deal_size: profileData.typical_deal_size ?? '',
        problem_we_solve: profileData.problem_we_solve ?? '',
      })
    }
  }

  async function fetchIcpProfile() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('icp_profiles')
      .select('*')
      .eq('name', 'Default ICP')
      .maybeSingle<IcpProfile>()

    if (error) {
      setErrorMessage(error.message)
      return
    }

    setIcpProfile(data ? normalizeProfile(data) : null)
  }

  async function handleSaveProfile() {
    setErrorMessage(null)
    setSavingProfile(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data, error } = await supabase
        .from('company_profile')
        .upsert({
          user_id: user.id,
          ...profileForm,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select('*')
        .single<CompanyProfile>()

      if (error) {
        throw error
      }

      setProfile(data)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAddClient() {
    setErrorMessage(null)
    setMessage(null)

    if (!formData.name.trim()) {
      setErrorMessage('Company name is required')
      return
    }

    setIsAdding(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.functions.invoke('save-client', {
        body: {
          name: formData.name,
          domain: emptyToUndefined(formData.domain),
          industry: emptyToUndefined(formData.industry),
          employee_count: formData.employee_count ? Number(formData.employee_count) : undefined,
          country: emptyToUndefined(formData.country),
          city: emptyToUndefined(formData.city),
          client_notes: emptyToUndefined(formData.client_notes),
        },
      })

      if (error) {
        throw error
      }

      setFormData(EMPTY_FORM)
      await fetchClients()
      flashMessage('CLIENT ADDED')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDeleteClient(clientId: string) {
    setErrorMessage(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', clientId)
      .eq('is_client', true)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    await Promise.all([fetchClients(), fetchIcpProfile()])
  }

  async function handleGenerateIcp() {
    setErrorMessage(null)
    setMessage(null)
    setIsGenerating(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.functions.invoke('generate-icp')

      if (error) {
        throw error
      }

      await fetchIcpProfile()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  function updateField(field: keyof ClientFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function updateProfileField(field: keyof typeof EMPTY_PROFILE_FORM, value: string) {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  function flashMessage(nextMessage: string) {
    setMessage(nextMessage)
    window.setTimeout(() => setMessage(null), 2000)
  }

  return {
    clients,
    profile,
    profileForm,
    savingProfile,
    profileSaved,
    icpProfile,
    formData,
    isLoading,
    isAdding,
    isGenerating,
    message,
    errorMessage,
    handleSaveProfile,
    handleAddClient,
    handleDeleteClient,
    handleGenerateIcp,
    updateField,
    updateProfileField,
  }
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizeProfile(profile: IcpProfile): IcpProfile {
  return {
    ...profile,
    industries: profile.industries ?? [],
    signals: profile.signals ?? [],
    anti_signals: profile.anti_signals ?? [],
    client_count: profile.client_count ?? 0,
  }
}
