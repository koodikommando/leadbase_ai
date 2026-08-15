'use client'

import ClientBaseSection from './components/ClientBaseSection'
import CompanyProfileSection from './components/CompanyProfileSection'
import IcpProfileSection from './components/IcpProfileSection'
import { useSettingsData } from './useSettingsData'

export default function SettingsPage() {
  const {
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
  } = useSettingsData()

  return (
    <div style={{ padding: '32px 32px 48px' }}>
      <CompanyProfileSection
        profile={profile}
        profileForm={profileForm}
        updateProfileField={updateProfileField}
        savingProfile={savingProfile}
        profileSaved={profileSaved}
        onSave={handleSaveProfile}
      />

      <div style={{ borderTop: '1px solid var(--border)', margin: '36px 0' }} />

      <ClientBaseSection
        clients={clients}
        formData={formData}
        updateField={updateField}
        isAdding={isAdding}
        message={message}
        errorMessage={errorMessage}
        isLoading={isLoading}
        onAddClient={handleAddClient}
        onDeleteClient={(clientId) => void handleDeleteClient(clientId)}
      />

      <div style={{ borderTop: '1px solid var(--border)', margin: '36px 0' }} />

      <IcpProfileSection
        icpProfile={icpProfile}
        clientCount={clients.length}
        isGenerating={isGenerating}
        onGenerate={handleGenerateIcp}
      />
    </div>
  )
}
