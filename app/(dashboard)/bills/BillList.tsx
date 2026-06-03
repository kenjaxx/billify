'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, Clock, Trash2, CheckCheck, Download } from 'lucide-react'
import { format } from 'date-fns'
import { exportToCSV, exportToPDF } from '@/lib/export'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  category: { name: string; icon: string | null; color: string | null }
}

const statusConfig = {
  PAID:    { label: 'Paid',    icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  UNPAID:  { label: 'Unpaid',  icon: Clock,       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  OVERDUE: { label: 'Overdue', icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const filters = ['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const

export default function BillList({ refresh }: { refresh: number }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof filters[number]>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { fetchBills() }, [refresh])

  const fetchBills = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bills')
      if (!res.ok) throw new Error('Failed to fetch')
      setBills(await res.json())
    } catch (err) {
      console.error(err)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id)
    await fetch(`/api/bills/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
    await fetchBills()
    setActionLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill?')) return
    setActionLoading(id)
    await fetch(`/api/bills/${id}`, { method: 'DELETE' })
    await fetchBills()
    setActionLoading(null)
  }

  const filtered = filter === 'ALL' ? bills : bills.filter(b => b.status === filter)

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
              border: filter === f ? 'none' : '0.5px solid var(--border-strong)',
              background: filter === f ? '#3b82f6' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {f === 'ALL' ? 'All' : statusConfig[f].label}
          </button>
        ))}
      </div>



        {/* Export bar */}
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
  <button
    onClick={() => exportToCSV(bills)}
    disabled={bills.length === 0}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '7px 14px', borderRadius: '8px',
      fontSize: '12px', fontWeight: '500', cursor: bills.length === 0 ? 'not-allowed' : 'pointer',
      border: '0.5px solid var(--border-strong)',
      background: 'transparent', color: 'var(--text-secondary)',
      opacity: bills.length === 0 ? 0.5 : 1,
    }}
  >
    <Download size={13} />
    Export CSV
  </button>
  <button
    onClick={() => exportToPDF(bills)}
    disabled={bills.length === 0}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '7px 14px', borderRadius: '8px',
      fontSize: '12px', fontWeight: '500', cursor: bills.length === 0 ? 'not-allowed' : 'pointer',
      border: '0.5px solid rgba(59,130,246,0.3)',
      background: 'rgba(59,130,246,0.08)', color: '#60a5fa',
      opacity: bills.length === 0 ? 0.5 : 1,
    }}
  >
    <FileText size={13} />
    Export PDF
  </button>
</div>








      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(59,130,246,0.3)',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px', gap: '8px' }}>
            <FileText size={36} color="var(--text-faint)" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No bills found</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Add a bill using the button above</p>
          </div>
        ) : (
          filtered.map((bill, i) => {
            const status = statusConfig[bill.status]
            const StatusIcon = status.icon
            const isLoading = actionLoading === bill.id
            return (
              <div
                key={bill.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--icon-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                  }}>
                    {bill.category.icon ?? '📄'}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{bill.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Due {format(new Date(bill.dueDate), 'MMM d, yyyy')} · {bill.category.name}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: '500',
                    padding: '4px 10px', borderRadius: '99px',
                    background: status.bg, color: status.color,
                  }}>
                    <StatusIcon size={11} />
                    {status.label}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '80px', textAlign: 'right' }}>
                    ₱{bill.amount.toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {bill.status !== 'PAID' && (
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        disabled={isLoading}
                        title="Mark as paid"
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                          background: 'transparent', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                        }}
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(bill.id)}
                      disabled={isLoading}
                      title="Delete"
                      style={{
                        width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                        background: 'transparent', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}