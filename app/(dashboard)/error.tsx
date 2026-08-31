'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error boundary:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      minHeight: '60vh', maxWidth: '420px', margin: '0 auto', padding: '24px',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'rgba(248,113,113,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        <AlertTriangle size={24} color="#f87171" />
      </div>
      <h1 style={{ fontSize: '17px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
        We hit an unexpected error loading this page. You can try again, or head back to your dashboard.
        {error.digest && (
          <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)' }}>
            Reference: {error.digest}
          </span>
        )}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="outline" onClick={() => reset()}>
          <RotateCcw size={14} />
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}