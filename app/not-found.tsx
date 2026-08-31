import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function RootNotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '24px', background: '#0f1117',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        <FileQuestion size={24} color="rgba(255,255,255,0.4)" />
      </div>
      <h1 style={{ fontSize: '18px', fontWeight: '500', color: '#fff', marginBottom: '8px' }}>
        Page not found
      </h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '24px' }}>
        This page doesn't exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        style={{
          display: 'inline-block', background: '#3b82f6', color: '#fff',
          borderRadius: '8px', padding: '10px 24px', fontSize: '13px',
          fontWeight: '500', textDecoration: 'none',
        }}
      >
        Go to dashboard
      </Link>
    </div>
  )
}