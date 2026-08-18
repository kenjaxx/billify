'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

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

export default function SetBudgetModal({ isOpen, onClose, onSuccess, month, year }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; month: number; year: number
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ categoryId: '', amount: '' })

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (isOpen) fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return
    setLoading(true)
    await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: form.categoryId, amount: parseFloat(form.amount), month, year }),
    })
    setLoading(false)
    setForm({ categoryId: '', amount: '' })
    onSuccess()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
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
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Saving...' : 'Save Budget'}
          </Button>
        </div>
      </div>
    </div>
  )
}