'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root error boundary:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '24px', background: '#0f1117',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'rgba(248,113,113,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        <AlertTriangle size={24} color="#f87171" />
      </div>
      <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '24px', maxWidth: '380px' }}>
        An unexpected error occurred.
        {error.digest && <span style={{ display: 'block', marginTop: '8px', fontSize: '11px', opacity: 0.6 }}>Reference: {error.digest}</span>}
      </p>
      <button
        onClick={() => reset()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '10px 24px', fontSize: '13px',
          fontWeight: '500', cursor: 'pointer',
        }}
      >
        <RotateCcw size={14} /> Try again
      </button>
    </div>
  )
}