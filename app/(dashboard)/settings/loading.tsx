import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <Skeleton style={{ width: '100px', height: '26px', marginBottom: '8px' }} />
        <Skeleton style={{ width: '240px', height: '14px' }} />
      </div>

      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px', marginBottom: '16px',
        }}>
          <Skeleton style={{ width: '120px', height: '15px', marginBottom: '18px' }} />
          <Skeleton style={{ width: '100%', height: '38px', marginBottom: '12px', borderRadius: '8px' }} />
          <Skeleton style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
        </div>
      ))}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
    </div>
  )
}