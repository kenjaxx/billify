'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '6px',
}

export default function CategoryModal({ category, isOpen, onClose, onSuccess }: {
  category: Category | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({ name: '', icon: '', color: '#3b82f6' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!category

  useEffect(() => {
    if (!isOpen) return
    setError('')
    if (category) {
      setForm({ name: category.name, icon: category.icon ?? '', color: category.color ?? '#3b82f6' })
    } else {
      setForm({ name: '', icon: '', color: '#3b82f6' })
    }
  }, [isOpen, category])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    setError('')
    try {
      const url = isEdit ? `/api/categories/${category!.id}` : '/api/categories'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, icon: form.icon || null, color: form.color || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save category')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border-input)',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '400px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit category' : 'New category'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '14px', padding: '10px 14px', borderRadius: '8px',
            fontSize: '12px', color: '#f87171',
            background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.2)',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input type="text" placeholder="e.g. Subscriptions" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Icon (emoji)</label>
              <input type="text" placeholder="📦" value={form.icon} maxLength={4}
                onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Color</label>
              <input type="color" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                style={{ ...inputStyle, padding: '4px', height: '38px', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !form.name.trim()} style={{
            flex: 1, background: (loading || !form.name.trim()) ? 'rgba(59,130,246,0.4)' : '#3b82f6',
            border: 'none', color: '#fff', borderRadius: '8px',
            padding: '10px', fontSize: '13px', fontWeight: '500',
            cursor: (loading || !form.name.trim()) ? 'not-allowed' : 'pointer',
          }}>{loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add category'}</button>
        </div>
      </div>
    </div>
  )
}