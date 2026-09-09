'use client'

import { useEffect, useState } from 'react'
import { X, PiggyBank, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

type Category = { id: string; name: string; icon: string | null; type?: string }
type GoalType = 'SAVING' | 'SPENDING'

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

export default function AddGoalModal({ isOpen, onClose, onSuccess, month, year }: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  month: number
  year: number
}) {
  const [type, setType] = useState<GoalType>('SAVING')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  useLockBodyScroll(isOpen)

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })

  useEffect(() => {
    if (!isOpen) return
    setType('SAVING')
    setName('')
    setAmount('')
    setCategoryId('')
    setCatLoading(true)
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: Category[]) => {
        setCategories(Array.isArray(data) ? data.filter(c => c.type === 'SPENDING') : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false))
  }, [isOpen])

  const canSubmit = type === 'SAVING'
    ? !!name.trim() && !!amount
    : !!categoryId && !!amount

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      if (type === 'SAVING') {
        const res = await fetch('/api/savings-goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, targetAmount: parseFloat(amount), month, year }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create goal')
        toast.success('Savings goal created.')
      } else {
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId, amount: parseFloat(amount), name: name.trim() || null, month, year }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create budget')
        toast.success('Spending budget created.')
      }
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create goal.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>New goal</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: '1.5' }}>
          Tied to <strong>{monthLabel} {year}</strong> — it'll only appear when viewing that month.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => setType('SAVING')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              padding: '12px', borderRadius: '10px', cursor: 'pointer',
              border: type === 'SAVING' ? '1.5px solid #a78bfa' : '0.5px solid var(--border-strong)',
              background: type === 'SAVING' ? 'rgba(167,139,250,0.1)' : 'transparent',
              color: type === 'SAVING' ? '#a78bfa' : 'var(--text-secondary)',
            }}
          >
            <PiggyBank size={18} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Saving goal</span>
          </button>
          <button
            type="button"
            onClick={() => setType('SPENDING')}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              padding: '12px', borderRadius: '10px', cursor: 'pointer',
              border: type === 'SPENDING' ? '1.5px solid #60a5fa' : '0.5px solid var(--border-strong)',
              background: type === 'SPENDING' ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: type === 'SPENDING' ? '#60a5fa' : 'var(--text-secondary)',
            }}
          >
            <Wallet size={18} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Spending budget</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {type === 'SAVING' ? (
            <div>
              <label style={labelStyle}>Goal name</label>
              <input
                type="text" placeholder="e.g. Emergency Fund" value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Category</label>
              {catLoading ? (
                <div style={{ ...inputStyle, color: 'var(--text-muted)' }}>Loading...</div>
              ) : categories.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', lineHeight: 1.5 }}>
                  No "Ongoing Spending" categories yet. Create one (e.g. Groceries) in Categories first.
                </div>
              ) : (
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={inputStyle}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
              )}
            </div>
          )}

          {type === 'SPENDING' && (
            <div>
              <label style={labelStyle}>Name this budget (optional)</label>
              <input
                type="text" placeholder="e.g. Groceries, Pet supplies" value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>{type === 'SAVING' ? 'Target amount (₱)' : 'Monthly limit (₱)'}</label>
            <input
              type="number" placeholder={type === 'SAVING' ? '50000' : '0.00'} value={amount}
              onChange={e => setAmount(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit} style={{ flex: 1 }}>
            {loading ? 'Creating...' : 'Create goal'}
          </Button>
        </div>
      </div>
    </div>
  )
}