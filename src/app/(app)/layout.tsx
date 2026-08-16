import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="h-full flex">
      <Sidebar />
      <main
        className="main-content flex-1 overflow-y-auto"
        style={{ marginLeft: 'var(--sidebar-width, 240px)' }}
      >
        {children}
      </main>
    </div>
  )
}
