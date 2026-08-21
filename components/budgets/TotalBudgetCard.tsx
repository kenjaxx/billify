'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Wallet, PiggyBank, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { fetcher } from '@/lib/swr-fetcher'

type MonthlyBudgetData = {
  isSet: boolean
  amount: number
  rollover: boolean
  rolledOverFrom: number
  personalSpent: number
  sharedSpent: number
  spent: number
  totalAvailable: number
  remaining: number
}

export default function TotalBudgetCard({ month, year }: { month: number; year: number }) {
  const { data, isLoading, mutate } = useSWR<MonthlyBudgetData>(
    `/api/monthly-budget?month=${month}&year=${year}`,
    fetcher
  )

  const [editing, setEditing] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [rolloverInput, setRolloverInput] = useState(false)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setAmountInput(data?.amount ? String(data.amount) : '')
    setRolloverInput(data?.rollover ?? false)
    setEditing(true)
  }

  const handleSave = async () => {
    const amount = parseFloat(amountInput)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid budget amount.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/monthly-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, rollover: rolloverInput, month, year }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to save budget')
      toast.success('Monthly budget saved.')
      setEditing(false)
      await mutate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save budget.')
    } finally {
      setSaving(false)
    }
  }

  const pct = data && data.totalAvailable > 0
    ? Math.min(Math.round((data.spent / data.totalAvailable) * 100), 100)
    : 0
  const barColor = pct >= 100 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#34d399'
  const isSaving = (data?.remaining ?? 0) > 0

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={15} color="#60a5fa" />
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Monthly Budget</h2>
        </div>
        {data?.isSet && !editing && (
          <button
            onClick={startEdit}
            title="Edit monthly budget"
            aria-label="Edit monthly budget"
            style={{
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Pencil size={13} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ height: '80px' }} />
      ) : editing || !data?.isSet ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Total budget for this month (₱)
            </label>
            <input
              type="number"
              placeholder="30000"
              value={amountInput}
              onChange={e => setAmountInput(e.target.value)}
              className="glow-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={rolloverInput} onChange={e => setRolloverInput(e.target.checked)} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Roll over unused budget into next month
            </span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {data?.isSet && (
              <Button variant="outline" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</Button>
            )}
            <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save budget'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>
              ₱{data.spent.toLocaleString()}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400' }}> / ₱{data.totalAvailable.toLocaleString()}</span>
            </span>
            {data.rolledOverFrom > 0 && (
              <span style={{ fontSize: '11px', color: '#a78bfa' }}>
                +₱{data.rolledOverFrom.toLocaleString()} rolled over
              </span>
            )}
          </div>

          <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '8px', marginBottom: '8px' }}>
            <div style={{
              height: '8px', borderRadius: '99px',
              width: `${pct}%`, background: barColor,
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            <span>₱{data.personalSpent.toLocaleString()} personal · ₱{data.sharedSpent.toLocaleString()} shared</span>
            <span>{pct}% used</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px', borderRadius: '8px',
            background: isSaving ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
          }}>
            <PiggyBank size={15} color={isSaving ? '#34d399' : '#f87171'} />
            <span style={{ fontSize: '12px', color: isSaving ? '#34d399' : '#f87171' }}>
              {isSaving
                ? `₱${data.remaining.toLocaleString()} saved so far this month`
                : `₱${Math.abs(data.remaining).toLocaleString()} over budget this month`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}