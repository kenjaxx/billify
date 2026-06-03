'use client'

import { useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import SetBudgetModal from '@/components/budgets/SetBudgetModal'

type Budget = {
  id: string
  amount: number
  category: { id: string; name: string; icon: string | null; color: string | null }
}

type Bill = { amount: number; status: string; categoryId: string }

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [b, bi] = await Promise.all([fetch('/api/budgets'), fetch('/api/bills')])
      setBudgets(await b.json())
      setBills(await bi.json())
      setLoading(false)
    }
    fetchData()
  }, [refresh])

  const getSpent = (categoryId: string) =>
    bills.filter(b => b.categoryId === categoryId).reduce((sum, b) => sum + b.amount, 0)

  const getPct = (spent: number, budget: number) => Math.min(Math.round((spent / budget) * 100), 100)
  const getBarColor = (pct: number) => pct >= 100 ? '#f87171' : pct >= 75 ? '#fbbf24' : '#34d399'

  const now = new Date()

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Budgets</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()} — spending limits per category
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#3b82f6', color: '#fff', border: 'none',
          padding: '9px 16px', borderRadius: '8px',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer',
        }}>
          <Plus size={15} /> Set Budget
        </button>
      </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px', gap: '8px' }}>
            <Wallet size={36} color="var(--text-faint)" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No budgets set yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Set a budget limit per category</p>
          </div>
        ) : (
          budgets.map((budget, i) => {
            const spent = getSpent(budget.category.id)
            const pct = getPct(spent, budget.amount)
            return (
              <div key={budget.id} style={{
                padding: '18px 20px',
                borderBottom: i < budgets.length - 1 ? '0.5px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>{budget.category.icon ?? '📄'}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {budget.category.name}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      ₱{spent.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {' '}/ ₱{budget.amount.toLocaleString()}
                    </span>
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
        onSuccess={() => { setRefresh(p => p + 1); setIsModalOpen(false) }}
      />
    </div>
  )
}