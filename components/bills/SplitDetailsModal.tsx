'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'

type Split = {
  id: string
  amount: number
  isPaid: boolean
  householdMember: { id: string; name: string | null; email: string; userId: string | null }
}

export default function SplitDetailsModal({
  billId,
  billTitle,
  splits,
  currentUserId,
  canManage,
  onClose,
  onUpdated,
}: {
  billId: string
  billTitle: string
  splits: Split[]
  currentUserId: string | null
  canManage: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  useLockBodyScroll(true)

  const togglePaid = async (split: Split) => {
    setUpdatingId(split.id)
    try {
      const res = await fetch(`/api/bills/${billId}/splits/${split.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !split.isPaid }),
      })
      if (!res.ok) throw new Error()
      onUpdated()
    } catch {
      toast.error('Could not update payment status.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>Split details</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>{billTitle}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {splits.map(split => {
            const canToggle = canManage || split.householdMember.userId === currentUserId
            return (
              <div key={split.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
              }}>
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {split.householdMember.name ?? split.householdMember.email.split('@')[0]}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ₱{split.amount.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => canToggle && togglePaid(split)}
                  disabled={!canToggle || updatingId === split.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: '500',
                    padding: '5px 10px', borderRadius: '99px', border: 'none',
                    background: split.isPaid ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                    color: split.isPaid ? '#34d399' : '#fbbf24',
                    cursor: canToggle ? 'pointer' : 'default',
                    opacity: updatingId === split.id ? 0.6 : 1,
                  }}
                >
                  {split.isPaid ? <><Check size={11} /> Paid</> : 'Unpaid'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}