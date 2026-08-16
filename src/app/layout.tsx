import type { Metadata } from 'next'
import './globals.css'

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
        className="h-full"
        style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        {children}
      </body>
    </html>
  )
}
