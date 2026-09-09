// app/(dashboard)/spending/loading.tsx — NEW FILE
import { Skeleton } from '@/components/ui/skeleton'

export default function SpendingLoading() {
  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Skeleton style={{ width: '160px', height: '26px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '280px', height: '14px' }} />
      </div>
      <Skeleton style={{ width: '100%', height: '48px', borderRadius: '10px', marginBottom: '20px' }} />
      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ padding: '18px 20px', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <Skeleton style={{ width: '140px', height: '16px' }} />
              <Skeleton style={{ width: '100px', height: '16px' }} />
            </div>
            <Skeleton style={{ width: '100%', height: '6px', borderRadius: '99px' }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}