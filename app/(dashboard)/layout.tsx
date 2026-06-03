import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f1117',
    }}>
      <Sidebar />
      {/* Offset main content by sidebar width on md+ screens */}
      <main style={{
        flex: 1,
        padding: '32px',
        paddingBottom: '80px',
        overflowX: 'hidden',
        background: '#0f1117',
        marginLeft: '220px',
      }}
        className="md:ml-[220px] ml-0"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}