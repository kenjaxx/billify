'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme-context'
type Category = { id: string; name: string; icon: string | null }

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  categoryId: string
  isRecurring: boolean
  notes: string | null
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

export default function EditBillModal({ bill, onClose, onSuccess }: {
  bill: Bill | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const { theme } = useTheme()
  const [form, setForm] = useState({
    title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '',
  })

  useEffect(() => {
    if (!bill) return
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    setForm({
      title: bill.title,
      amount: String(bill.amount),
      categoryId: bill.categoryId,
      dueDate: bill.dueDate.split('T')[0],
      isRecurring: bill.isRecurring,
      notes: bill.notes ?? '',
    })
  }, [bill])

  const handleSubmit = async () => {
    if (!bill || !form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          categoryId: form.categoryId,
          dueDate: form.dueDate,
          isRecurring: form.isRecurring,
          notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update bill')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update bill.')
    } finally {
      setLoading(false)
    }
  }

  if (!bill) return null

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
        width: '100%', maxWidth: '440px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Edit bill</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Bill title</label>
            <input type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Amount (₱)</label>
            <input type="number" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.dueDate}
  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
  style={{ ...inputStyle, colorScheme: theme }} />
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={form.notes} rows={2}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="edit-recurring" checked={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
              style={{ accentColor: '#3b82f6' }} />
            <label htmlFor="edit-recurring" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Recurring monthly bill
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.amount || !form.categoryId || !form.dueDate}
            style={{
              flex: 1,
              background: (loading || !form.title || !form.amount || !form.categoryId || !form.dueDate) ? 'rgba(59,130,246,0.4)' : '#3b82f6',
              border: 'none', color: '#fff', borderRadius: '8px',
              padding: '10px', fontSize: '13px', fontWeight: '500',
              cursor: (loading || !form.title || !form.amount || !form.categoryId || !form.dueDate) ? 'not-allowed' : 'pointer',
            }}
          >{loading ? 'Saving...' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}