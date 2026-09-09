// components/budgets/SetSpendingBudgetModal.tsx — NEW FILE
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

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

type EditTarget = {
  id: string
  name: string | null
  amount: number
}

export default function SetSpendingBudgetModal({
  isOpen,
  onClose,
  onSuccess,
  month,
  year,
  categoryId,
  categoryName,
  categoryIcon,
  editBudget,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  month: number
  year: number
  categoryId: string
  categoryName: string
  categoryIcon: string | null
  editBudget?: EditTarget | null
}) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const isEdit = !!editBudget

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    if (editBudget) {
      setName(editBudget.name ?? '')
      setAmount(String(editBudget.amount))
    } else {
      setName('')
      setAmount('')
    }
  }, [isOpen, editBudget])

  const handleSubmit = async () => {
    if (!amount) return
    setLoading(true)
    try {
      const url = isEdit ? `/api/budgets/${editBudget!.id}` : '/api/budgets'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? { amount: parseFloat(amount), name: name.trim() || null }
            : { categoryId, amount: parseFloat(amount), name: name.trim() || null, month, year }
        ),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save budget')
      toast.success(isEdit ? 'Budget updated.' : 'Budget added.')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save budget.')
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
            {isEdit ? 'Edit budget' : 'New budget'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '8px',
          background: 'var(--bg-tertiary)', marginBottom: '16px',
        }}>
          <span style={{ fontSize: '16px' }}>{categoryIcon ?? '📄'}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{categoryName}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>What is this budget for? (optional)</label>
            <input
              type="text"
              placeholder="e.g. Pet supplies, Gifts, Trip fund"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              Give it a name so you can track it separately from other budgets in this category. Leave blank for a general budget.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Monthly limit (₱)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !amount} style={{ flex: 1 }}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add budget'}
          </Button>
        </div>
      </div>
    </div>
  )
}