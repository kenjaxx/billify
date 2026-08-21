'use client'

import { useEffect, useState } from 'react'
import { Users, Info } from 'lucide-react'
import Link from 'next/link'

type HouseholdMember = {
  id: string
  name: string | null
  email: string
  userId: string | null
  status: 'PENDING' | 'ACCEPTED'
}

export type SplitEntry = { householdMemberId: string; amount: number }

const amountInputStyle: React.CSSProperties = {
  width: '80px',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
  outline: 'none',
  textAlign: 'right',
}

export default function SplitBillSection({
  billAmount,
  enabled,
  onToggle,
  splits,
  onSplitsChange,
  currentUserEmail,
}: {
  billAmount: number
  enabled: boolean
  onToggle: (enabled: boolean) => void
  splits: SplitEntry[]
  onSplitsChange: (splits: SplitEntry[]) => void
  currentUserEmail?: string | null
}) {
  const [members, setMembers] = useState<HouseholdMember[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/household')
      .then(r => r.json())
      .then(data => {
        const accepted = data.household
          ? data.household.members.filter((m: HouseholdMember) => m.status === 'ACCEPTED')
          : []
        setMembers(accepted)
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  const applyEqualSplit = (memberList: HouseholdMember[]) => {
    if (memberList.length === 0 || !billAmount) return
    const share = Math.round((billAmount / memberList.length) * 100) / 100
    const next = memberList.map((m, i) => ({
      householdMemberId: m.id,
      // Give any rounding remainder to the last person so it sums exactly.
      amount: i === memberList.length - 1
        ? Math.round((billAmount - share * (memberList.length - 1)) * 100) / 100
        : share,
    }))
    onSplitsChange(next)
  }

  const handleToggle = (next: boolean) => {
    onToggle(next)
    if (next && members && members.length > 0) applyEqualSplit(members)
    if (!next) onSplitsChange([])
  }

  const updateAmount = (memberId: string, amount: number) => {
    onSplitsChange(splits.map(s => (s.householdMemberId === memberId ? { ...s, amount } : s)))
  }

  const total = splits.reduce((sum, s) => sum + (Number.isFinite(s.amount) ? s.amount : 0), 0)
  const diff = Math.round((billAmount - total) * 100) / 100

  if (loading) return null

  if (!members || members.length < 2) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 12px', borderRadius: '8px',
        background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
      }}>
        <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Invite someone to your household to split this bill —{' '}
          <Link href="/household" style={{ color: '#60a5fa' }}>manage household</Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: enabled ? '10px' : 0 }}>
        <input type="checkbox" checked={enabled} onChange={e => handleToggle(e.target.checked)} />
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={13} /> Split with household
        </span>
      </label>

      {enabled && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '8px',
          background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
          borderRadius: '8px', padding: '12px',
        }}>
          {members.map(m => {
            const entry = splits.find(s => s.householdMemberId === m.id)
            const isYou = currentUserEmail && m.email.toLowerCase() === currentUserEmail.toLowerCase()
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{
                  fontSize: '12px', color: 'var(--text-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {m.name ?? m.email.split('@')[0]}{isYou ? ' (you)' : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₱</span>
                  <input
                    type="number"
                    value={entry?.amount ?? 0}
                    onChange={e => updateAmount(m.id, e.target.value === '' ? 0 : Number(e.target.value))}
                    style={amountInputStyle}
                  />
                </div>
              </div>
            )
          })}

          <div style={{
            display: 'flex', justifyContent: 'space-between', paddingTop: '8px',
            borderTop: '0.5px solid var(--border)', marginTop: '2px',
          }}>
            <button
              type="button"
              onClick={() => applyEqualSplit(members)}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0 }}
            >
              Split equally
            </button>
            <span style={{ fontSize: '11px', color: diff === 0 ? 'var(--text-muted)' : '#f87171' }}>
              {diff === 0 ? 'Adds up ✓' : `₱${Math.abs(diff).toLocaleString()} ${diff > 0 ? 'unassigned' : 'over'}`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}