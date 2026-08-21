'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { Plus, Wallet, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { IconActionButton } from '@/components/ui/icon-action-button'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import SetBudgetModal from '@/components/budgets/SetBudgetModal'
import TotalBudgetCard from '@/components/budgets/TotalBudgetCard'
import SavingsGoalsSection from '@/components/budgets/SavingsGoalsSection'
import { fetcher } from '@/lib/swr-fetcher'

type Budget = {
  id: string
  amount: number
  category: { id: string; name: string; icon: string | null; color: string | null }
}

type Bill = { amount: number; status: string; categoryId: string; dueDate: string }

export default function BudgetsPageClient({
  initialBudgets,
  initialBills,
  initialMonth,
  initialYear,
}: {
  initialBudgets: Budget[]
  initialBills: Bill[]
  initialMonth: number
  initialYear: number
}) {
  const router = useRouter()
  const [viewDate, setViewDate] = useState({ month: initialMonth, year: initialYear })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isInitialMonth = viewDate.month === initialMonth && viewDate.year === initialYear

  const { data: bills = [] } = useSWR<Bill[]>('/api/bills', fetcher, {
    fallbackData: initialBills,
  })

  const { data: budgets = [], isLoading: budgetsLoading, mutate: mutateBudgets } = useSWR<Budget[]>(
    `/api/budgets?month=${viewDate.month}&year=${viewDate.year}`,
    fetcher,
    { fallbackData: isInitialMonth ? initialBudgets : undefined }
  )

  // Same cache key TotalBudgetCard uses internally, so this piggybacks
  // on SWR's deduping instead of firing a second network request — we
  // only need `remaining` here, to tell SavingsGoalsSection how much is
  // available to allocate toward a goal this month.
  const { data: monthlyBudget } = useSWR<{ remaining: number }>(
    `/api/monthly-budget?month=${viewDate.month}&year=${viewDate.year}`,
    fetcher
  )

  const loading = budgetsLoading && budgets.length === 0

  const getSpent = (categoryId: string) =>
    bills
      .filter(b => b.categoryId === categoryId)
      .filter(b => {
        const d = new Date(b.dueDate)
        return d.getMonth() + 1 === viewDate.month && d.getFullYear() === viewDate.year
      })
      .reduce((sum, b) => sum + b.amount, 0)

  const getPct = (spent: number, budget: number) => Math.min(Math.round((spent / budget) * 100), 100)
  const getBarColor = (pct: number) => pct >= 100 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#34d399'

  const monthLabel = new Date(viewDate.year, viewDate.month - 1, 1).toLocaleString('default', { month: 'long' })

  const prevMonth = () => setViewDate(({ month, year }) =>
    month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year })
  const nextMonth = () => setViewDate(({ month, year }) =>
    month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year })

  const now = new Date()
  const isCurrentMonth = viewDate.month === now.getMonth() + 1 && viewDate.year === now.getFullYear()

  const confirmDeleteBudget = async () => {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/budgets/${pendingDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`Budget for "${pendingDelete.category.name}" deleted.`)
      await mutateBudgets()
      router.refresh()
    } catch {
      toast.error('Could not delete budget.')
    } finally {
      setDeleteLoading(false)
      setPendingDelete(null)
    }
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Budgets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Spending limits per category
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={15} /> Set Budget
        </Button>
      </div>

      {/* Month navigator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        marginBottom: '20px',
        background: 'var(--bg-card)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '10px',
      }}>
        <button onClick={prevMonth} style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: '0.5px solid var(--border-strong)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
          {monthLabel} {viewDate.year} {isCurrentMonth && (
            <span style={{ fontSize: '10px', color: '#60a5fa', marginLeft: '6px' }}>· Current</span>
          )}
        </span>
        <button onClick={nextMonth} style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: '0.5px solid var(--border-strong)',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Total monthly budget — deducted by personal bills + your own
          share of household/shared bills — with savings and rollover. */}
      <TotalBudgetCard month={viewDate.month} year={viewDate.year} />

      {/* Savings goals — leftover budget can be manually allocated here. */}
      <SavingsGoalsSection availableToAllocate={Math.max(monthlyBudget?.remaining ?? 0, 0)} />

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(59,130,246,0.3)',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={`No budgets set for ${monthLabel} ${viewDate.year}`}
            description="Set a spending limit per category to track how close you are to going over."
            action={{ label: 'Set a budget', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          budgets.map((budget, i) => {
            const spent = getSpent(budget.category.id)
            const pct = getPct(spent, budget.amount)
            return (
              <div key={budget.id} style={{
                padding: '18px 20px',
                borderBottom: i < budgets.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{budget.category.icon ?? '📄'}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {budget.category.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        ₱{spent.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {' '}/ ₱{budget.amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <IconActionButton
                        icon={Pencil}
                        tone="default"
                        label={`Edit budget for ${budget.category.name}`}
                        onClick={() => setEditingBudget(budget)}
                      />
                      <IconActionButton
                        icon={Trash2}
                        tone="danger"
                        label={`Delete budget for ${budget.category.name}`}
                        onClick={() => setPendingDelete(budget)}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '6px' }}>
                  <div style={{
                    height: '6px', borderRadius: '99px',
                    width: `${pct}%`, background: getBarColor(pct),
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{pct}% used</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ₱{Math.max(budget.amount - spent, 0).toLocaleString()} left
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { mutateBudgets(); setIsModalOpen(false); router.refresh() }}
        month={viewDate.month}
        year={viewDate.year}
      />

      <SetBudgetModal
        isOpen={editingBudget !== null}
        onClose={() => setEditingBudget(null)}
        onSuccess={() => {
          mutateBudgets()
          setEditingBudget(null)
          toast.success('Budget updated.')
          router.refresh()
        }}
        month={viewDate.month}
        year={viewDate.year}
        editBudget={editingBudget ? {
          id: editingBudget.id,
          categoryId: editingBudget.category.id,
          categoryName: editingBudget.category.name,
          categoryIcon: editingBudget.category.icon,
          amount: editingBudget.amount,
        } : null}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this budget?"
        description={`The spending limit for "${pendingDelete?.category.name ?? ''}" will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDeleteBudget}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}