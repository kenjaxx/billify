'use client'

import { useEffect, useState } from 'react'
import {
  FileText, CheckCircle, AlertCircle, Clock, Trash2, CheckCheck,
  Download, Pencil, Search, ArrowUpDown, CalendarDays,
} from 'lucide-react'
import { format } from 'date-fns'
import { exportToCSV, exportToPDF } from '@/lib/export'
import { getEffectiveStatus } from '@/lib/bill-status'
import EditBillModal from './EditBillModal'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  categoryId: string
  isRecurring: boolean
  notes: string | null
  category: { name: string; icon: string | null; color: string | null }
}

const statusConfig = {
  PAID:    { label: 'Paid',    icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  UNPAID:  { label: 'Unpaid',  icon: Clock,       color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  OVERDUE: { label: 'Overdue', icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
}

const filters = ['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const
type SortOption = 'dueDateAsc' | 'dueDateDesc' | 'amountDesc' | 'amountAsc' | 'titleAsc'
type DateRangeOption = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '8px',
  padding: '7px 10px',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  outline: 'none',
  cursor: 'pointer',
}

export default function BillList({ refresh }: { refresh: number }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<typeof filters[number]>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)

  // Search / sort / date range
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('dueDateAsc')
  const [dateRange, setDateRange] = useState<DateRangeOption>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

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
      setSelectedIds(new Set())
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

  // ── Filtering pipeline ──────────────────────────────────────────────
  const now = new Date()

  let filtered = filter === 'ALL'
    ? bills
    : bills.filter(b => getEffectiveStatus(b) === filter)

  filtered = filtered.filter(b => {
    const due = new Date(b.dueDate)
    if (dateRange === 'thisMonth') {
      return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()
    }
    if (dateRange === 'lastMonth') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return due.getMonth() === lastMonthDate.getMonth() && due.getFullYear() === lastMonthDate.getFullYear()
    }
    if (dateRange === 'thisYear') {
      return due.getFullYear() === now.getFullYear()
    }
    if (dateRange === 'custom') {
      if (customFrom && due < new Date(customFrom)) return false
      if (customTo && due > new Date(customTo)) return false
      return true
    }
    return true
  })

  if (search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.notes ?? '').toLowerCase().includes(q) ||
      b.category.name.toLowerCase().includes(q)
    )
  }

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'dueDateAsc':  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'dueDateDesc': return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      case 'amountDesc':  return b.amount - a.amount
      case 'amountAsc':   return a.amount - b.amount
      case 'titleAsc':    return a.title.localeCompare(b.title)
      default: return 0
    }
  })

  // ── Bulk selection helpers ────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = filtered.length > 0 && filtered.every(b => selectedIds.has(b.id))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(b => b.id)))
    }
  }

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      await fetch('/api/bills/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'markPaid' }),
      })
      await fetchBills()
    } finally {
      setBulkLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected bill(s)? This cannot be undone.`)) return
    setBulkLoading(true)
    try {
      await fetch('/api/bills/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
      })
      await fetchBills()
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div>
      {/* Status filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
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

      {/* Search / sort / date range toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search bills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '0.5px solid var(--border-input)',
              borderRadius: '8px', padding: '8px 10px 8px 30px',
              fontSize: '12px', color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown size={13} color="var(--text-muted)" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} style={selectStyle}>
            <option value="dueDateAsc">Due date (soonest)</option>
            <option value="dueDateDesc">Due date (latest)</option>
            <option value="amountDesc">Amount (high to low)</option>
            <option value="amountAsc">Amount (low to high)</option>
            <option value="titleAsc">Title (A–Z)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarDays size={13} color="var(--text-muted)" />
          <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRangeOption)} style={selectStyle}>
            <option value="all">All time</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              style={{ ...selectStyle, colorScheme: 'inherit' }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              style={{ ...selectStyle, colorScheme: 'inherit' }} />
          </>
        )}
      </div>

      {/* Export bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(59,130,246,0.25)',
          borderRadius: '10px', padding: '10px 16px', marginBottom: '12px',
        }}>
          <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '500' }}>
            {selectedIds.size} bill{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkMarkPaid}
              disabled={bulkLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '12px', fontWeight: '500',
                border: 'none', background: '#34d399', color: '#0a0c10',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <CheckCheck size={13} />
              Mark Paid
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '7px',
                fontSize: '12px', fontWeight: '500',
                border: '0.5px solid rgba(248,113,113,0.3)',
                background: 'rgba(248,113,113,0.12)', color: '#f87171',
                cursor: bulkLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      )}

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
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Try adjusting your filters or search</p>
          </div>
        ) : (
          <>
            {/* Select-all row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 20px',
              borderBottom: '0.5px solid var(--border)',
              background: 'var(--bg-tertiary)',
            }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {allSelected ? 'Deselect all' : 'Select all'} ({filtered.length})
              </span>
            </div>

            {filtered.map((bill, i) => {
              const effectiveStatus = getEffectiveStatus(bill)
              const status = statusConfig[effectiveStatus]
              const StatusIcon = status.icon
              const isLoading = actionLoading === bill.id
              const isSelected = selectedIds.has(bill.id)
              return (
                <div
                  key={bill.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: isSelected ? 'rgba(59,130,246,0.05)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(bill.id)}
                      style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                    />
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'var(--icon-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                    }}>
                      {bill.category.icon ?? '📄'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {bill.title}
                        {bill.isRecurring && (
                          <span style={{
                            marginLeft: '6px', fontSize: '9px', fontWeight: '600',
                            color: '#60a5fa', background: 'rgba(59,130,246,0.12)',
                            padding: '1px 6px', borderRadius: '99px',
                          }}>
                            RECURRING
                          </span>
                        )}
                      </p>
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
                      {effectiveStatus !== 'PAID' && (
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
                        onClick={() => setEditingBill(bill)}
                        disabled={isLoading}
                        title="Edit"
                        style={{
                          width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                          background: 'transparent', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                        }}
                      >
                        <Pencil size={14} />
                      </button>
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
            })}
          </>
        )}
      </div>

      <EditBillModal
        bill={editingBill}
        onClose={() => setEditingBill(null)}
        onSuccess={() => { setEditingBill(null); fetchBills() }}
      />
    </div>
  )
}