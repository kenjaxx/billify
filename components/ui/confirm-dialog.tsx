'use client'

import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', padding: '24px',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: danger ? 'rgba(248,113,113,0.1)' : 'rgba(59,130,246,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <AlertTriangle size={20} color={danger ? '#f87171' : '#60a5fa'} />
        </div>
        <h2
          id="confirm-dialog-title"
          style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}
        >
          {title}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, background: 'transparent',
              border: '0.5px solid var(--border-strong)',
              color: 'var(--text-secondary)', borderRadius: '8px',
              padding: '10px', fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              background: danger ? 'rgba(248,113,113,0.15)' : '#3b82f6',
              border: danger ? '0.5px solid rgba(248,113,113,0.25)' : 'none',
              color: danger ? '#f87171' : '#fff',
              borderRadius: '8px',
              padding: '10px', fontSize: '13px', fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}