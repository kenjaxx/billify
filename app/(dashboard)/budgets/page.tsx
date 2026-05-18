'use client'

import { useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import SetBudgetModal from '../../../components/budgets/SetBudgetModal'

type Budget = {
  id: string
  amount: number
  category: { id: string; name: string; icon: string | null; color: string | null }
}

type Bill = {
  amount: number
  status: string
  categoryId: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [budgetsRes, billsRes] = await Promise.all([
          fetch('/api/budgets'),
          fetch('/api/bills'),
        ])
        const budgetsData = await budgetsRes.json()
        const billsData = await billsRes.json()
        setBudgets(budgetsData)
        setBills(billsData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [refresh])

  const getSpent = (categoryId: string) => {
    return bills
      .filter(b => b.categoryId === categoryId)
      .reduce((sum, b) => sum + b.amount, 0)
  }

  const getPercentage = (spent: number, budget: number) => {
    return Math.min(Math.round((spent / budget) * 100), 100)
  }

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {monthName} {now.getFullYear()} — spending limits per category
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Set Budget
        </button>
      </div>

      {/* Budget List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No budgets set yet</p>
            <p className="text-gray-300 text-xs mt-1">Set a budget limit per category</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {budgets.map(budget => {
              const spent = getSpent(budget.category.id)
              const pct = getPercentage(spent, budget.amount)
              const barColor = getBarColor(pct)
              return (
                <div key={budget.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{budget.category.icon ?? '📄'}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {budget.category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        ₱{spent.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {' '}/ ₱{budget.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{pct}% used</span>
                    <span className="text-xs text-gray-400">
                      ₱{Math.max(budget.amount - spent, 0).toLocaleString()} left
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Set Budget Modal */}
      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setRefresh(p => p + 1)
          setIsModalOpen(false)
        }}
      />
    </div>
  )
}