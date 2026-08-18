'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

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

  const isEdit = !!category

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    if (category) {
      setForm({ name: category.name, icon: category.icon ?? '', color: category.color ?? '#3b82f6' })
    } else {
      setForm({ name: '', icon: '', color: '#3b82f6' })
    }
  }, [isOpen, category])

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setLoading(true)
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
      toast.error(err instanceof Error ? err.message : 'Failed to save category.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit category' : 'New category'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input type="text" placeholder="e.g. Subscriptions" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Icon (emoji)</label>
            <input type="text" placeholder="📦" value={form.icon} maxLength={4}
              onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <ColorSwatchPicker value={form.color} onChange={color => setForm(p => ({ ...p, color }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name.trim()} style={{ flex: 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </div>
    </div>
  )
}