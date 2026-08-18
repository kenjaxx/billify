import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <Skeleton style={{ width: '180px', height: '26px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '260px', height: '14px' }} />
      </div>

      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '16px',
          }}>
            <Skeleton style={{ width: '34px', height: '34px', borderRadius: '8px', marginBottom: '12px' }} />
            <Skeleton style={{ width: '80px', height: '11px', marginBottom: '8px' }} />
            <Skeleton style={{ width: '60px', height: '20px' }} />
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '20px',
      }}>
        <Skeleton style={{ width: '120px', height: '15px', marginBottom: '16px' }} />
        <Skeleton style={{ width: '100%', height: '40px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '100%', height: '40px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '100%', height: '40px' }} />
      </div>

      <div className="dashboard-content-grid">
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px',
        }}>
          <Skeleton style={{ width: '130px', height: '15px', marginBottom: '16px' }} />
          {[0, 1, 2].map(i => (
            <Skeleton key={i} style={{ width: '100%', height: '50px', marginBottom: '8px' }} />
          ))}
        </div>
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px',
        }}>
          <Skeleton style={{ width: '100%', height: '320px' }} />
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}