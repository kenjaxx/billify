import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import TopBar from '@/components/layout/TopBar'
import MobileFAB from '@/components/layout/MobileFAB'

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
      <main className="dashboard-main">
        {children}
      </main>
      <MobileFAB />
      <BottomNav />
    </div>
  )
}