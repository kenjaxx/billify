'use client'

import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  FileText, CheckCircle, AlertCircle, Clock, Trash2, CheckCheck,
  Pencil, Search, ArrowUpDown, CalendarDays, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { exportToPDF } from '@/lib/export'
import { getEffectiveStatus } from '@/lib/bill-status'
import { fetcher } from '@/lib/swr-fetcher'
import { useDebouncedValue } from '@/lib/use-debounce'
import { Button } from '@/components/ui/button'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { EmptyState } from '@/components/ui/empty-state'
import EditBillModal from './EditBillModal'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { useTheme } from '@/lib/theme-context'
import ReceiptViewButton from '@/components/bills/ReceiptViewButton'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  categoryId: string
  isRecurring: boolean
  notes: string | null
  receiptUrl: string | null
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

type PendingDelete =
  | { type: 'single'; id: string; title: string }
  | { type: 'bulk'; count: number }
  | null

const dateRangeLabels: Record<DateRangeOption, string> = {
  all: '',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  thisYear: 'This year',
  custom: 'Custom range',
}

export default function BillList({ refresh, initialBills }: { refresh: number; initialBills: Bill[] }) {
  const router = useRouter()
  const { data: bills = [], isLoading: loading, mutate, error } = useSWR<Bill[]>('/api/bills', fetcher, {
    fallbackData: initialBills,
  })

  const [filter, setFilter] = useState<typeof filters[number]>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [sortBy, setSortBy] = useState<SortOption>('dueDateAsc')
  const [dateRange, setDateRange] = useState<DateRangeOption>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [exportingPdf, setExportingPdf] = useState(false)

  const { theme } = useTheme()

  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    mutate()
  }, [refresh, mutate])

  useEffect(() => {
    if (error) toast.error('Could not load bills.')
  }, [error])

  const handleMarkPaid = async (id: string, title: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      if (!res.ok) throw new Error()
      toast.success(`"${title}" marked as paid.`)
      await mutate()
      router.refresh()
    } catch {
      toast.error('Could not update the bill.')
    } finally {
      setActionLoading(null)
    }
  }

  const requestDelete = (id: string, title: string) => setPendingDelete({ type: 'single', id, title })
  const requestBulkDelete = () => {
    if (selectedIds.size === 0) return
    setPendingDelete({ type: 'bulk', count: selectedIds.size })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    try {
      if (pendingDelete.type === 'single') {
        setActionLoading(pendingDelete.id)
        const res = await fetch(`/api/bills/${pendingDelete.id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        toast.success(`"${pendingDelete.title}" deleted.`)
      } else {
        setBulkLoading(true)
        const res = await fetch('/api/bills/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedIds), action: 'delete' }),
        })
        if (!res.ok) throw new Error()
        toast.success(`${pendingDelete.count} bill(s) deleted.`)
        setSelectedIds(new Set())
      }
      await mutate()
      router.refresh()
    } catch {
      toast.error('Delete failed. Please try again.')
    } finally {
      setActionLoading(null)
      setBulkLoading(false)
      setConfirmLoading(false)
      setPendingDelete(null)
    }
  }

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

  if (debouncedSearch.trim()) {
    const q = debouncedSearch.trim().toLowerCase()
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

  const buildFilterSummary = (): string | undefined => {
    const parts: string[] = []
    if (filter !== 'ALL') parts.push(statusConfig[filter].label)
    if (dateRange === 'custom') {
      if (customFrom || customTo) {
        parts.push(`${customFrom || '…'} to ${customTo || '…'}`)
      }
    } else if (dateRangeLabels[dateRange]) {
      parts.push(dateRangeLabels[dateRange])
    }
    if (search.trim()) parts.push(`"${search.trim()}"`)
    return parts.length > 0 ? parts.join(' · ') : undefined
  }

  const handleExportPDF = async () => {
    setExportingPdf(true)
    try {
      await exportToPDF(filtered, 'bills', { filterSummary: buildFilterSummary() })
      toast.success('PDF exported.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not export PDF.')
    } finally {
      setExportingPdf(false)
    }
  }

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
      const res = await fetch('/api/bills/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: 'markPaid' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Selected bills marked as paid.')
      setSelectedIds(new Set())
      await mutate()
      router.refresh()
    } catch {
      toast.error('Could not update selected bills.')
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
            aria-pressed={filter === f}
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
            aria-label="Search bills"
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
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            style={selectStyle}
            aria-label="Sort bills"
          >
            <option value="dueDateAsc">Due date (soonest)</option>
            <option value="dueDateDesc">Due date (latest)</option>
            <option value="amountDesc">Amount (high to low)</option>
            <option value="amountAsc">Amount (low to high)</option>
            <option value="titleAsc">Title (A–Z)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarDays size={13} color="var(--text-muted)" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRangeOption)}
            style={selectStyle}
            aria-label="Filter by date range"
          >
            <option value="all">All time</option>
            <option value="thisMonth">This month</option>
            <option value="lastMonth">Last month</option>
            <option value="thisYear">This year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <>
            <input type="date" aria-label="From date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
  style={{ ...selectStyle, colorScheme: theme }} />
<span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
<input type="date" aria-label="To date" value={customTo} onChange={e => setCustomTo(e.target.value)}
  style={{ ...selectStyle, colorScheme: theme }} />
          </>
        )}
      </div>

      {/* Export bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <Button
          size="sm"
          onClick={handleExportPDF}
          disabled={filtered.length === 0 || exportingPdf}
          title={filtered.length === 0 ? 'No bills to export in the current view' : 'Export the currently filtered bills as PDF'}
          style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}
        >
          {exportingPdf
            ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
            : <><FileText size={13} /> Export PDF</>
          }
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(59,130,246,0.08)', border: '0.5px solid rgba(59,130,246,0.25)',
          borderRadius: '10px', padding: '10px 16px', marginBottom: '12px',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: '500' }}>
            {selectedIds.size} bill{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="sm"
              onClick={handleBulkMarkPaid}
              disabled={bulkLoading}
              style={{ background: '#34d399', color: '#0a0c10' }}
            >
              <CheckCheck size={13} />
              Mark Paid
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={requestBulkDelete}
              disabled={bulkLoading}
            >
              <Trash2 size={13} />
              Delete
            </Button>
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
          bills.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No bills yet"
              description="Add your first bill manually, describe it in plain text, or upload a receipt and let AI fill it in."
              action={{ label: 'Add your first bill', onClick: () => router.push('/bills?add=1') }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No bills found"
              description="Try adjusting your filters, date range, or search term."
            />
          )
        ) : (
          <>
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
                aria-label={allSelected ? 'Deselect all bills' : 'Select all bills'}
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
                  className="bill-row"
                  style={{
                    borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: isSelected ? 'rgba(59,130,246,0.05)' : 'transparent',
                  }}
                >
                  <div className="bill-row-left">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(bill.id)}
                      aria-label={`Select ${bill.title}`}
                    />
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: 'var(--icon-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                      flexShrink: 0,
                    }}>
                      {bill.category.icon ?? '📄'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
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

                  <div className="bill-row-right">
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
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {effectiveStatus !== 'PAID' && (
                        <IconActionButton
                          icon={CheckCheck}
                          tone="success"
                          label="Mark as paid"
                          onClick={() => handleMarkPaid(bill.id, bill.title)}
                          disabled={isLoading}
                        />
                      )}
                      {bill.receiptUrl && <ReceiptViewButton billId={bill.id} />}
                      <IconActionButton
                        icon={Pencil}
                        tone="default"
                        label="Edit"
                        onClick={() => setEditingBill(bill)}
                        disabled={isLoading}
                      />
                      <IconActionButton
                        icon={Trash2}
                        tone="danger"
                        label="Delete"
                        onClick={() => requestDelete(bill.id, bill.title)}
                        disabled={isLoading}
                      />
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
        onSuccess={() => { setEditingBill(null); toast.success('Bill updated.'); mutate(); router.refresh() }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.type === 'bulk' ? 'Delete selected bills?' : 'Delete this bill?'}
        description={
          pendingDelete?.type === 'bulk'
            ? `This will permanently delete ${pendingDelete.count} bill(s). This cannot be undone.`
            : `"${pendingDelete?.type === 'single' ? pendingDelete.title : ''}" will be permanently deleted. This cannot be undone.`
        }
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}