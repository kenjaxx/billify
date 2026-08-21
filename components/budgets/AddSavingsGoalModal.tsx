'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

export default function AddSavingsGoalModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useLockBodyScroll(isOpen)

  const handleSubmit = async () => {
    if (!name.trim() || !targetAmount) return
    setLoading(true)
    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, targetAmount: parseFloat(targetAmount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create goal')
      setName('')
      setTargetAmount('')
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
      <div className="modal-card" style={{ maxWidth: '380px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>New savings goal</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Goal name</label>
            <input
              type="text" placeholder="e.g. Emergency Fund" value={name}
              onChange={e => setName(e.target.value)}
              className="glow-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Target amount (₱)</label>
            <input
              type="number" placeholder="50000" value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              className="glow-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !targetAmount} style={{ flex: 1 }}>
            {loading ? 'Creating...' : 'Create goal'}
          </Button>
        </div>
      </div>
    </div>
  )
}