'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

type Category = { id: string; name: string; icon: string | null }

type EditTarget = {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  amount: number
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

export default function SetBudgetModal({ isOpen, onClose, onSuccess, month, year, editBudget }: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  month: number
  year: number
  editBudget?: EditTarget | null
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ categoryId: '', amount: '' })

  const isEdit = !!editBudget

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    if (editBudget) {
      setForm({ categoryId: editBudget.categoryId, amount: String(editBudget.amount) })
      return
    }
    setForm({ categoryId: '', amount: '' })
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [isOpen, editBudget])

  const handleSubmit = async () => {
    if (!form.categoryId || !form.amount) return
    setLoading(true)
    try {
      if (isEdit && editBudget) {
        await fetch(`/api/budgets/${editBudget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(form.amount) }),
        })
      } else {
        await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: form.categoryId, amount: parseFloat(form.amount), month, year }),
        })
      }
      setForm({ categoryId: '', amount: '' })
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit budget' : 'Set Budget'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Category</label>
            {isEdit && editBudget ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <span>{editBudget.categoryIcon ?? '📄'}</span>
                <span>{editBudget.categoryName}</span>
              </div>
            ) : (
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Monthly limit (₱)</label>
            <input
              type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="glow-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.categoryId || !form.amount} style={{ flex: 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Save Budget'}
          </Button>
        </div>
      </div>
    </div>
  )
}