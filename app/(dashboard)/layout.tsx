import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
    }}>
      <Sidebar />
      <TopBar />
      {/* Offset by sidebar width on md+, and by topbar height */}
      <main
        style={{
          flex: 1,
          padding: '32px',
          paddingTop: '88px', /* 56px topbar + 32px spacing */
          paddingBottom: '80px',
          overflowX: 'hidden',
          background: 'var(--bg-primary)',
        }}
        className="md:ml-[220px] ml-0"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}