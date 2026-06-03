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

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '6px',
}

export default function AddBillModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })

  useEffect(() => {
    if (!isOpen) return
    setCatLoading(true)
    setCatError('')
    fetch('/api/categories')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          setCatError('No categories found. Please add a category first.')
          setCategories([])
        } else {
          setCategories(data)
        }
      })
      .catch(err => {
        console.error(err)
        setCatError('Failed to load categories. Please try again.')
        setCategories([])
      })
      .finally(() => setCatLoading(false))
  }, [isOpen])

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      setForm({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })
      onSuccess()
    } catch (err) {
      console.error(err)
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
        width: '100%', maxWidth: '440px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Add new bill</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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
            {catLoading ? (
              <div style={{ ...inputStyle, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px', height: '12px',
                  border: '2px solid rgba(59,130,246,0.3)',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
                }} />
                Loading categories...
              </div>
            ) : catError ? (
              <div style={{ fontSize: '12px', color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '0.5px solid rgba(248,113,113,0.2)' }}>
                {catError}
              </div>
            ) : (
              <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              style={{ ...inputStyle, colorScheme: 'inherit' }} />
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
            <label htmlFor="recurring" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
            disabled={loading || catLoading || categories.length === 0}
            style={{
              flex: 1,
              background: (loading || catLoading || categories.length === 0) ? 'rgba(59,130,246,0.4)' : '#3b82f6',
              border: 'none', color: '#fff', borderRadius: '8px',
              padding: '10px', fontSize: '13px', fontWeight: '500',
              cursor: (loading || catLoading || categories.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >{loading ? 'Saving...' : 'Add Bill'}</button>
        </div>
      </div>
    </div>
  )
}