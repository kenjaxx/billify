import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardNotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      minHeight: '60vh', maxWidth: '420px', margin: '0 auto', padding: '24px',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'var(--icon-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '18px',
      }}>
        <FileQuestion size={24} color="var(--text-muted)" />
      </div>
      <h1 style={{ fontSize: '17px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
        Page not found
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
        This page doesn't exist or may have been moved.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  )
}