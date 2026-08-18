import { Skeleton } from '@/components/ui/skeleton'

export default function ReportsLoading() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <Skeleton style={{ width: '110px', height: '26px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '260px', height: '14px' }} />
      </div>

      <div className="reports-summary-grid" style={{ marginBottom: '20px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <Skeleton style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
            <div>
              <Skeleton style={{ width: '90px', height: '11px', marginBottom: '8px' }} />
              <Skeleton style={{ width: '70px', height: '16px' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <Skeleton style={{ width: '200px', height: '15px', marginBottom: '20px' }} />
        <Skeleton style={{ width: '100%', height: '220px' }} />
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px',
      }}>
        <Skeleton style={{ width: '160px', height: '15px', marginBottom: '20px' }} />
        <Skeleton style={{ width: '100%', height: '260px' }} />
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}