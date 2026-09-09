// app/(dashboard)/spending/SpendingPageClient.tsx
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight, Wallet, Pencil, Trash2, MapPin, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { EmptyState } from '@/components/ui/empty-state'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { fetcher } from '@/lib/swr-fetcher'
import AddExpenseModal from '@/components/spending/AddExpenseModal'
import SetSpendingBudgetModal from '@/components/budgets/SetSpendingBudgetModal'

type Entry = { id: string; amount: number; note: string | null; spentAt: string }
type Envelope = {
  id: string
  name: string | null
  amount: number
  spent: number
  remaining: number
  pctUsed: number
  entries: Entry[]
}
type CategorySummary = {
  category: { id: string; name: string; icon: string | null; color: string | null }
  envelopes: Envelope[]
  unassigned: { spent: number; entries: Entry[] }
  totalBudget: number
  totalSpent: number
}
type SummaryResponse = { month: number; year: number; summary: CategorySummary[] }

function getBarColor(pct: number) {
  return pct >= 100 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#34d399'
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return format(new Date(iso), 'MMM d, yyyy')
}

export default function SpendingPageClient({
  initialSummary,
  initialMonth,
  initialYear,
}: {
  initialSummary: CategorySummary[]
  initialMonth: number
  initialYear: number
}) {
  const router = useRouter()
  const [viewDate, setViewDate] = useState({ month: initialMonth, year: initialYear })
  const isInitialMonth = viewDate.month === initialMonth && viewDate.year === initialYear

  const { data, mutate } = useSWR<SummaryResponse>(
    `/api/expenses/summary?month=${viewDate.month}&year=${viewDate.year}`,
    fetcher,
    { fallbackData: isInitialMonth ? { month: initialMonth, year: initialYear, summary: initialSummary } : undefined }
  )

  const summary = data?.summary ?? []

  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | undefined>(undefined)
  const [defaultBudgetId, setDefaultBudgetId] = useState<string | null | undefined>(undefined)
  const [editingEntry, setEditingEntry] = useState<{ id: string; amount: number; note: string | null; categoryId: string; spentAt: string; budgetId?: string | null } | null>(null)

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetModalCategory, setBudgetModalCategory] = useState<{ id: string; name: string; icon: string | null } | null>(null)
  const [editingBudget, setEditingBudget] = useState<{ id: string; name: string | null; amount: number } | null>(null)

  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<{ id: string; label: string } | null>(null)
  const [pendingDeleteBudget, setPendingDeleteBudget] = useState<{ id: string; label: string } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const monthLabel = new Date(viewDate.year, viewDate.month - 1, 1).toLocaleString('default', { month: 'long' })
  const prevMonth = () => setViewDate(({ month, year }) => month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year })
  const nextMonth = () => setViewDate(({ month, year }) => month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year })

  const openAddExpense = (categoryId?: string, budgetId?: string | null) => {
    setEditingEntry(null)
    setDefaultCategoryId(categoryId)
    setDefaultBudgetId(budgetId)
    setExpenseModalOpen(true)
  }

  const openEditExpense = (entry: Entry, categoryId: string, budgetId: string | null) => {
    setEditingEntry({ id: entry.id, amount: entry.amount, note: entry.note, categoryId, spentAt: entry.spentAt, budgetId })
    setExpenseModalOpen(true)
  }

  const openNewBudget = (cat: CategorySummary['category']) => {
    setBudgetModalCategory(cat)
    setEditingBudget(null)
    setBudgetModalOpen(true)
  }

  const openEditBudget = (cat: CategorySummary['category'], envelope: Envelope) => {
    setBudgetModalCategory(cat)
    setEditingBudget({ id: envelope.id, name: envelope.name, amount: envelope.amount })
    setBudgetModalOpen(true)
  }

  const confirmDeleteEntry = async () => {
    if (!pendingDeleteEntry) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/expenses/${pendingDeleteEntry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Expense deleted.')
      await mutate()
    } catch {
      toast.error('Could not delete expense.')
    } finally {
      setConfirmLoading(false)
      setPendingDeleteEntry(null)
    }
  }

  const confirmDeleteBudget = async () => {
    if (!pendingDeleteBudget) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/budgets/${pendingDeleteBudget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Budget deleted.')
      await mutate()
    } catch {
      toast.error('Could not delete budget.')
    } finally {
      setConfirmLoading(false)
      setPendingDeleteBudget(null)
    }
  }

  const totalBudget = summary.reduce((sum, s) => sum + s.totalBudget, 0)
  const totalSpent = summary.reduce((sum, s) => sum + s.totalSpent, 0)

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Spending Tracker</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Track gradual spending against your ongoing budgets (Groceries, etc.)
          </p>
        </div>
        <Button onClick={() => openAddExpense()}>
          <Plus size={15} /> Log Expense
        </Button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        marginBottom: '20px',
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '10px',
      }}>
        <button onClick={prevMonth} style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: '0.5px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
        }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
          {monthLabel} {viewDate.year}
        </span>
        <button onClick={nextMonth} style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: '0.5px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
        }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {summary.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#60a5fa" />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total spending budgets</p>
              <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                ₱{totalSpent.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px' }}>/ ₱{totalBudget.toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {summary.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No spending categories yet"
            description='Create a category like "Groceries" and set it as "Ongoing Spending" in Categories, then set a monthly budget for it.'
            action={{ label: 'Go to categories', href: '/categories' }}
          />
        ) : (
          summary.map((s, i) => {
            const isExpanded = expandedCategoryId === s.category.id
            const catPct = s.totalBudget > 0 ? Math.min(Math.round((s.totalSpent / s.totalBudget) * 100), 100) : 0
            const barColor = getBarColor(catPct)
            const allEntries = [
              ...s.envelopes.flatMap(env => env.entries.map(e => ({ entry: e, envelopeId: env.id as string | null, envelopeName: env.name }))),
              ...s.unassigned.entries.map(e => ({ entry: e, envelopeId: null as string | null, envelopeName: null })),
            ].sort((a, b) => new Date(b.entry.spentAt).getTime() - new Date(a.entry.spentAt).getTime())

            return (
              <div key={s.category.id} style={{ borderBottom: i < summary.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{s.category.icon ?? '📄'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{s.category.name}</span>
                      {s.envelopes.length === 0 && (
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '99px' }}>
                          No budgets set
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          ₱{s.totalSpent.toLocaleString()}
                        </span>
                        {s.totalBudget > 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> / ₱{s.totalBudget.toLocaleString()}</span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openNewBudget(s.category)}>
                        <Layers size={13} /> New Budget
                      </Button>
                      <Button size="sm" onClick={() => openAddExpense(s.category.id)}>
                        <Plus size={13} /> Add
                      </Button>
                    </div>
                  </div>
                  {s.totalBudget > 0 && (
                    <>
                      <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '6px' }}>
                        <div style={{
                          height: '6px', borderRadius: '99px',
                          width: `${catPct}%`, background: barColor,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{catPct}% used</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ₱{Math.max(s.totalBudget - s.totalSpent, 0).toLocaleString()} left
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Individual budget envelopes */}
                {s.envelopes.length > 0 && (
                  <div style={{ padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {s.envelopes.map(env => (
                      <div key={env.id} style={{
                        padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                            {env.name ?? 'General'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              ₱{env.spent.toLocaleString()} / ₱{env.amount.toLocaleString()}
                            </span>
                            <IconActionButton icon={Pencil} tone="default" label={`Edit ${env.name ?? 'budget'}`} onClick={() => openEditBudget(s.category, env)} size={12} />
                            <IconActionButton
                              icon={Trash2}
                              tone="danger"
                              label={`Delete ${env.name ?? 'budget'}`}
                              onClick={() => setPendingDeleteBudget({ id: env.id, label: env.name ?? 'this budget' })}
                              size={12}
                            />
                          </div>
                        </div>
                        <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '5px' }}>
                          <div style={{
                            height: '5px', borderRadius: '99px',
                            width: `${Math.min(env.pctUsed, 100)}%`, background: getBarColor(env.pctUsed),
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '0 20px 16px' }}>
                  <button
                    onClick={() => setExpandedCategoryId(isExpanded ? null : s.category.id)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    {isExpanded ? 'Hide' : 'Show'} {allEntries.length} entr{allEntries.length !== 1 ? 'ies' : 'y'}
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {allEntries.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>No expenses logged this month yet.</p>
                    ) : (
                      allEntries.map(({ entry, envelopeId, envelopeName }) => (
                        <div key={entry.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', gap: '10px',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ₱{entry.amount.toLocaleString()}
                              <span style={{
                                fontSize: '9px', fontWeight: '600', color: '#a78bfa',
                                background: 'rgba(167,139,250,0.12)', padding: '1px 6px', borderRadius: '99px',
                              }}>
                                {envelopeName ?? (envelopeId ? 'General' : 'Unassigned')}
                              </span>
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {entry.note && <><MapPin size={10} /> {entry.note} · </>}
                              {relativeTime(entry.spentAt)} · {format(new Date(entry.spentAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <IconActionButton
                              icon={Pencil}
                              tone="default"
                              label="Edit expense"
                              onClick={() => openEditExpense(entry, s.category.id, envelopeId)}
                            />
                            <IconActionButton
                              icon={Trash2}
                              tone="danger"
                              label="Delete expense"
                              onClick={() => setPendingDeleteEntry({ id: entry.id, label: `₱${entry.amount.toLocaleString()}${entry.note ? ` at ${entry.note}` : ''}` })}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => { setExpenseModalOpen(false); mutate(); router.refresh() }}
        month={viewDate.month}
        year={viewDate.year}
        defaultCategoryId={defaultCategoryId}
        defaultBudgetId={defaultBudgetId}
        editExpense={editingEntry}
      />

      {budgetModalCategory && (
        <SetSpendingBudgetModal
          isOpen={budgetModalOpen}
          onClose={() => setBudgetModalOpen(false)}
          onSuccess={() => { setBudgetModalOpen(false); mutate(); router.refresh() }}
          month={viewDate.month}
          year={viewDate.year}
          categoryId={budgetModalCategory.id}
          categoryName={budgetModalCategory.name}
          categoryIcon={budgetModalCategory.icon}
          editBudget={editingBudget}
        />
      )}

      <ConfirmDialog
        open={pendingDeleteEntry !== null}
        title="Delete this expense?"
        description={`"${pendingDeleteEntry?.label ?? ''}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDeleteEntry}
        onCancel={() => setPendingDeleteEntry(null)}
      />

      <ConfirmDialog
        open={pendingDeleteBudget !== null}
        title="Delete this budget?"
        description={`"${pendingDeleteBudget?.label ?? ''}" will be removed. Any expenses logged under it stay, but become unassigned. This cannot be undone.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setPendingDeleteBudget(null)}
      />
    </div>
  )
}