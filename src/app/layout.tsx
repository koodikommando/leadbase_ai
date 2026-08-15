import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'CRM — Lead Intelligence',
  description: 'AI-powered lead search and enrichment',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className="h-full flex"
        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        <Sidebar />
        <main
          className="main-content flex-1 overflow-y-auto"
          style={{ marginLeft: 'var(--sidebar-width, 240px)' }}
        >
          {children}
        </main>
      </body>
    </html>
  )
}
