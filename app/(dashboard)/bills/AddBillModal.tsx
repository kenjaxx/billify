'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Category = { id: string; name: string; icon: string | null }

const inputStyle = {
  width: '100%',
  background: '#0a0c10',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: '#fff',
  outline: 'none',
}

const labelStyle = {
  fontSize: '11px',
  color: 'rgba(255,255,255,0.4)',
  display: 'block',
  marginBottom: '6px',
}

export default function AddBillModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })

  useEffect(() => {
    if (isOpen) fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [isOpen])

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    await fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    })
    setLoading(false)
    setForm({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })
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
        background: '#161b27',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '28px',
        width: '100%',
        maxWidth: '440px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>Add new bill</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Bill title</label>
            <input type="text" placeholder="e.g. Meralco, Globe Wifi" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Amount (₱)</label>
            <input type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}  style={{ ...inputStyle, colorScheme: 'dark' }} />
              
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea placeholder="Any additional notes..." value={form.notes} rows={2}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="recurring" checked={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
              style={{ accentColor: '#3b82f6' }} />
            <label htmlFor="recurring" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              Recurring monthly bill
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            border: 'none', color: '#fff', borderRadius: '8px',
            padding: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>{loading ? 'Saving...' : 'Add Bill'}</button>
        </div>
      </div>
    </div>
  )
}