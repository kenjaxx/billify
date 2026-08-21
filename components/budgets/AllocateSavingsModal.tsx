'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'
import type { SavingsGoal } from './SavingsGoalsSection'

export default function AllocateSavingsModal({ goal, availableToAllocate, onClose, onSuccess }: {
  goal: SavingsGoal
  availableToAllocate: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [amount, setAmount] = useState(availableToAllocate > 0 ? String(availableToAllocate) : '')
  const [loading, setLoading] = useState(false)

  useLockBodyScroll(true)

  const handleSubmit = async () => {
    const value = parseFloat(amount)
    if (!value || value <= 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/savings-goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocate: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to allocate')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to allocate savings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Add to "{goal.name}"</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Currently ₱{goal.savedAmount.toLocaleString()} of ₱{goal.targetAmount.toLocaleString()}
          {availableToAllocate > 0 && ` — you have ₱${availableToAllocate.toLocaleString()} saved this month available to put toward it.`}
        </p>

        <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Amount to add (₱)</label>
        <input
          type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          className="glow-input"
          style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !amount} style={{ flex: 1 }}>
            {loading ? 'Saving...' : 'Add to goal'}
          </Button>
        </div>
      </div>
    </div>
  )
}