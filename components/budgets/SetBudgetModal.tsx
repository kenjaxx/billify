'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Category = { id: string; name: string; icon: string | null }

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

export default function SetBudgetModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ categoryId: '', amount: '' })

  useEffect(() => {
    if (isOpen) fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return
    setLoading(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: form.categoryId, amount: parseFloat(form.amount) }),
    })
    setLoading(false)
    setForm({ categoryId: '', amount: '' })
    onSuccess()
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Set Budget</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Category</label>
            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Monthly limit (₱)</label>
            <input type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            border: 'none', color: '#fff', borderRadius: '8px',
            padding: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>{loading ? 'Saving...' : 'Save Budget'}</button>
        </div>
      </div>
    </div>
  )
}