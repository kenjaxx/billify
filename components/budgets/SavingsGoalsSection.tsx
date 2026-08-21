'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { PiggyBank, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { EmptyState } from '@/components/ui/empty-state'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { fetcher } from '@/lib/swr-fetcher'
import AddSavingsGoalModal from './AddSavingsGoalModal'
import AllocateSavingsModal from './AllocateSavingsModal'

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
}

export default function SavingsGoalsSection({ availableToAllocate }: { availableToAllocate: number }) {
  const { data: goals = [], isLoading, mutate } = useSWR<SavingsGoal[]>('/api/savings-goals', fetcher)

  const [addOpen, setAddOpen] = useState(false)
  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavingsGoal | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/savings-goals/${pendingDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`"${pendingDelete.name}" removed.`)
      await mutate()
    } catch {
      toast.error('Could not delete goal.')
    } finally {
      setDeleteLoading(false)
      setPendingDelete(null)
    }
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PiggyBank size={15} color="#a78bfa" />
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Savings Goals</h2>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={13} /> New goal
        </Button>
      </div>

      {isLoading ? (
        <div style={{ height: '60px' }} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Set a target — like an emergency fund or a trip — and put leftover budget toward it each month."
          action={{ label: 'Create a goal', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {goals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min(Math.round((goal.savedAmount / goal.targetAmount) * 100), 100) : 0
            const reached = goal.savedAmount >= goal.targetAmount
            return (
              <div key={goal.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{goal.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconActionButton
                      icon={PiggyBank}
                      tone="success"
                      label={`Allocate savings to ${goal.name}`}
                      onClick={() => setAllocatingGoal(goal)}
                    />
                    <IconActionButton
                      icon={Trash2}
                      tone="danger"
                      label={`Delete ${goal.name}`}
                      onClick={() => setPendingDelete(goal)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>₱{goal.savedAmount.toLocaleString()} / ₱{goal.targetAmount.toLocaleString()}</span>
                  <span style={{ color: reached ? '#34d399' : 'var(--text-muted)' }}>{reached ? 'Goal reached 🎉' : `${pct}%`}</span>
                </div>
                <div style={{ background: 'var(--icon-bg)', borderRadius: '99px', height: '8px' }}>
                  <div style={{
                    height: '8px', borderRadius: '99px',
                    width: `${pct}%`, background: reached ? '#34d399' : '#a78bfa',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AddSavingsGoalModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => { setAddOpen(false); toast.success('Goal created.'); mutate() }}
      />

      {allocatingGoal && (
        <AllocateSavingsModal
          goal={allocatingGoal}
          availableToAllocate={availableToAllocate}
          onClose={() => setAllocatingGoal(null)}
          onSuccess={() => { setAllocatingGoal(null); toast.success('Savings allocated.'); mutate() }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this goal?"
        description={`"${pendingDelete?.name ?? ''}" and its saved progress will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}