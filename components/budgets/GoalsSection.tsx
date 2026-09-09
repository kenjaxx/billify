'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { format } from 'date-fns'
import { PiggyBank, Plus, Trash2, Pencil, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { EmptyState } from '@/components/ui/empty-state'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { fetcher } from '@/lib/swr-fetcher'
import AddGoalModal from './AddGoalModal'
import AllocateSavingsModal from './AllocateSavingsModal'
import SetSpendingBudgetModal from './SetSpendingBudgetModal'
import AddExpenseModal from '@/components/spending/AddExpenseModal'

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
}

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

export default function GoalsSection({
  availableToAllocate,
  month,
  year,
}: {
  availableToAllocate: number
  month: number
  year: number
}) {
  const { data: savingsGoals = [], isLoading: goalsLoading, mutate: mutateGoals } = useSWR<SavingsGoal[]>(
    `/api/savings-goals?month=${month}&year=${year}`,
    fetcher
  )
  const { data: summaryData, isLoading: summaryLoading, mutate: mutateSummary } = useSWR<SummaryResponse>(
    `/api/expenses/summary?month=${month}&year=${year}`,
    fetcher
  )

  const summary = summaryData?.summary ?? []

  const [addOpen, setAddOpen] = useState(false)
  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null)
  const [pendingDeleteGoal, setPendingDeleteGoal] = useState<SavingsGoal | null>(null)

  const [editingEnvelope, setEditingEnvelope] = useState<{
    id: string; name: string | null; amount: number
    categoryId: string; categoryName: string; categoryIcon: string | null
  } | null>(null)
  const [pendingDeleteEnvelope, setPendingDeleteEnvelope] = useState<{ id: string; label: string } | null>(null)

  const [expandedEnvelopeId, setExpandedEnvelopeId] = useState<string | null>(null)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseDefaults, setExpenseDefaults] = useState<{ categoryId?: string; budgetId?: string | null }>({})
  const [editingEntry, setEditingEntry] = useState<{ id: string; amount: number; note: string | null; categoryId: string; spentAt: string; budgetId?: string | null } | null>(null)
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<{ id: string; label: string } | null>(null)

  const [confirmLoading, setConfirmLoading] = useState(false)

  const refreshAll = () => { mutateGoals(); mutateSummary() }

  const spendingItems = summary.flatMap(s =>
    s.envelopes.map(env => ({ ...env, category: s.category }))
  )

  const unassignedTotal = summary.reduce((sum, s) => sum + s.unassigned.spent, 0)
  const unassignedEntries = summary
    .flatMap(s => s.unassigned.entries.map(e => ({ ...e, category: s.category })))
    .sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime())

  const loading = goalsLoading || summaryLoading
  const hasGoals = savingsGoals.length > 0 || spendingItems.length > 0

  const confirmDeleteGoal = async () => {
    if (!pendingDeleteGoal) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/savings-goals/${pendingDeleteGoal.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`"${pendingDeleteGoal.name}" removed.`)
      await mutateGoals()
    } catch {
      toast.error('Could not delete goal.')
    } finally {
      setConfirmLoading(false)
      setPendingDeleteGoal(null)
    }
  }

  const confirmDeleteEnvelope = async () => {
    if (!pendingDeleteEnvelope) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/budgets/${pendingDeleteEnvelope.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Budget deleted.')
      await mutateSummary()
    } catch {
      toast.error('Could not delete budget.')
    } finally {
      setConfirmLoading(false)
      setPendingDeleteEnvelope(null)
    }
  }

  const confirmDeleteEntry = async () => {
    if (!pendingDeleteEntry) return
    setConfirmLoading(true)
    try {
      const res = await fetch(`/api/expenses/${pendingDeleteEntry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Expense deleted.')
      await mutateSummary()
    } catch {
      toast.error('Could not delete expense.')
    } finally {
      setConfirmLoading(false)
      setPendingDeleteEntry(null)
    }
  }

  const openLogExpense = (categoryId?: string, budgetId?: string | null) => {
    setEditingEntry(null)
    setExpenseDefaults({ categoryId, budgetId })
    setExpenseModalOpen(true)
  }

  const openEditExpense = (entry: Entry, categoryId: string, budgetId: string | null) => {
    setEditingEntry({ id: entry.id, amount: entry.amount, note: entry.note, categoryId, spentAt: entry.spentAt, budgetId })
    setExpenseModalOpen(true)
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PiggyBank size={15} color="#a78bfa" />
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            Goals <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}>· {monthLabel} {year}</span>
          </h2>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} /> New goal
        </Button>
      </div>

      {loading ? (
        <div style={{ height: '60px' }} />
      ) : !hasGoals ? (
        <EmptyState
          icon={PiggyBank}
          title="No goals for this month"
          description="Set a savings target, or a monthly spending budget for something like Groceries or Transportation."
          action={{ label: 'Create a goal', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {savingsGoals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100) : 0
            const reached = goal.savedAmount >= goal.targetAmount
            const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0)
            return (
              <div key={`saving-${goal.id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PiggyBank size={13} color="#a78bfa" /> {goal.name}
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '1px 6px', borderRadius: '99px' }}>SAVING</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconActionButton icon={PiggyBank} tone="success" label={`Allocate savings to ${goal.name}`} onClick={() => setAllocatingGoal(goal)} />
                    <IconActionButton icon={Trash2} tone="danger" label={`Delete ${goal.name}`} onClick={() => setPendingDeleteGoal(goal)} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                  <span>
                    ₱{goal.savedAmount.toLocaleString()} / ₱{goal.targetAmount.toLocaleString()}
                    {!reached && <span style={{ color: 'var(--text-dim)' }}> (₱{remaining.toLocaleString()} left)</span>}
                  </span>
                  <span style={{ color: reached ? '#34d399' : 'var(--text-muted)' }}>{reached ? 'Goal reached 🎉' : `${pct}%`}</span>
                </div>
                <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '8px' }}>
                  <div style={{ height: '8px', borderRadius: '99px', width: `${pct}%`, background: reached ? '#34d399' : '#a78bfa', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )
          })}

          {spendingItems.map(env => {
            const isExpanded = expandedEnvelopeId === env.id
            const barColor = getBarColor(env.pctUsed)
            const isOverBudget = env.spent > env.amount
            // env.remaining is already max(amount - spent, 0) from the API,
            // so this is 0 once you're at/over budget — show "over" instead.
            return (
              <div key={`spending-${env.id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{env.category.icon ?? '📄'}</span> {env.name ?? env.category.name}
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '1px 6px', borderRadius: '99px' }}>SPENDING</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Button size="sm" onClick={() => openLogExpense(env.category.id, env.id)}>
                      <Plus size={12} /> Log expense
                    </Button>
                    <IconActionButton
                      icon={Pencil}
                      tone="default"
                      label={`Edit ${env.name ?? env.category.name}`}
                      onClick={() => setEditingEnvelope({
                        id: env.id, name: env.name, amount: env.amount,
                        categoryId: env.category.id, categoryName: env.category.name, categoryIcon: env.category.icon,
                      })}
                    />
                    <IconActionButton
                      icon={Trash2}
                      tone="danger"
                      label={`Delete ${env.name ?? env.category.name}`}
                      onClick={() => setPendingDeleteEnvelope({ id: env.id, label: env.name ?? env.category.name })}
                    />
                  </div>
                </div>

                {/* ── Updated line: now shows "(₱X left)" like the savings goals do,
                     or "₱X over" once spending has passed the limit. ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
  <span>
    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>₱{env.spent.toLocaleString()}</span>
    {' '}/ ₱{env.amount.toLocaleString()}
    {isOverBudget ? (
      <span style={{ color: '#f87171', fontWeight: 500 }}> (₱{(env.spent - env.amount).toLocaleString()} over)</span>
    ) : (
      <span style={{ color: '#60a5fa', fontWeight: 500 }}> (₱{env.remaining.toLocaleString()} left)</span>
    )}
  </span>
  <span style={{ color: isOverBudget ? '#f87171' : 'var(--text-muted)' }}>
    {isOverBudget ? 'Over budget' : `${env.pctUsed}% used`}
  </span>
</div>

                <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '8px', marginBottom: '6px' }}>
                  <div style={{ height: '8px', borderRadius: '99px', width: `${Math.min(env.pctUsed, 100)}%`, background: barColor, transition: 'width 0.3s ease' }} />
                </div>
                <button
                  onClick={() => setExpandedEnvelopeId(isExpanded ? null : env.id)}
                  style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '11px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {isExpanded ? 'Hide' : 'Show'} {env.entries.length} entr{env.entries.length !== 1 ? 'ies' : 'y'}
                </button>

                {isExpanded && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {env.entries.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>No expenses logged yet.</p>
                    ) : (
                      env.entries.map(entry => (
                        <div key={entry.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', gap: '10px',
                        }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>₱{entry.amount.toLocaleString()}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {entry.note && <><MapPin size={10} /> {entry.note} · </>}
                              {relativeTime(entry.spentAt)} · {format(new Date(entry.spentAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <IconActionButton icon={Pencil} tone="default" label="Edit expense" onClick={() => openEditExpense(entry, env.category.id, env.id)} />
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
          })}
        </div>
      )}

      {unassignedTotal > 0 && (
        <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>
              Other spending (no goal) — ₱{unassignedTotal.toLocaleString()}
            </span>
            <Button size="sm" variant="outline" onClick={() => openLogExpense()}>
              <Plus size={12} /> Log expense
            </Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unassignedEntries.slice(0, 5).map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-tertiary)', gap: '10px',
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    ₱{entry.amount.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {entry.category.name}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {entry.note ? `${entry.note} · ` : ''}{relativeTime(entry.spentAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <IconActionButton icon={Pencil} tone="default" label="Edit expense" onClick={() => openEditExpense(entry, entry.category.id, null)} />
                  <IconActionButton
                    icon={Trash2}
                    tone="danger"
                    label="Delete expense"
                    onClick={() => setPendingDeleteEntry({ id: entry.id, label: `₱${entry.amount.toLocaleString()}` })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddGoalModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); refreshAll() }}
        month={month}
        year={year}
      />

      {allocatingGoal && (
        <AllocateSavingsModal
          goal={allocatingGoal}
          availableToAllocate={availableToAllocate}
          onClose={() => setAllocatingGoal(null)}
          onSuccess={() => { setAllocatingGoal(null); toast.success('Savings allocated.'); mutateGoals() }}
        />
      )}

      {editingEnvelope && (
        <SetSpendingBudgetModal
          isOpen={true}
          onClose={() => setEditingEnvelope(null)}
          onSuccess={() => { setEditingEnvelope(null); mutateSummary() }}
          month={month}
          year={year}
          categoryId={editingEnvelope.categoryId}
          categoryName={editingEnvelope.categoryName}
          categoryIcon={editingEnvelope.categoryIcon}
          editBudget={{ id: editingEnvelope.id, name: editingEnvelope.name, amount: editingEnvelope.amount }}
        />
      )}

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSuccess={() => { setExpenseModalOpen(false); mutateSummary() }}
        month={month}
        year={year}
        defaultCategoryId={expenseDefaults.categoryId}
        defaultBudgetId={expenseDefaults.budgetId}
        editExpense={editingEntry}
      />

      <ConfirmDialog
        open={pendingDeleteGoal !== null}
        title="Delete this goal?"
        description={`"${pendingDeleteGoal?.name ?? ''}" and its saved progress will be permanently deleted.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDeleteGoal}
        onCancel={() => setPendingDeleteGoal(null)}
      />

      <ConfirmDialog
        open={pendingDeleteEnvelope !== null}
        title="Delete this budget?"
        description={`"${pendingDeleteEnvelope?.label ?? ''}" will be removed. Any expenses logged under it stay, but become unassigned.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDeleteEnvelope}
        onCancel={() => setPendingDeleteEnvelope(null)}
      />

      <ConfirmDialog
        open={pendingDeleteEntry !== null}
        title="Delete this expense?"
        description={`"${pendingDeleteEntry?.label ?? ''}" will be permanently deleted.`}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDeleteEntry}
        onCancel={() => setPendingDeleteEntry(null)}
      />
    </div>
  )
}