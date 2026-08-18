import { Skeleton } from '@/components/ui/skeleton'

export default function BillsLoading() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <Skeleton style={{ width: '80px', height: '26px', marginBottom: '8px' }} />
          <Skeleton style={{ width: '220px', height: '14px' }} />
        </div>
        <Skeleton style={{ width: '110px', height: '36px', borderRadius: '8px' }} />
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[0, 1, 2, 3].map(i => <Skeleton key={i} style={{ width: '70px', height: '30px', borderRadius: '8px' }} />)}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: i < 5 ? '0.5px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Skeleton style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
              <div>
                <Skeleton style={{ width: '140px', height: '13px', marginBottom: '6px' }} />
                <Skeleton style={{ width: '100px', height: '11px' }} />
              </div>
            </div>
            <Skeleton style={{ width: '80px', height: '13px' }} />
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}