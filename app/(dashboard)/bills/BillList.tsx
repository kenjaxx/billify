'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, AlertCircle, Clock, Trash2, CheckCheck } from 'lucide-react'
import { format } from 'date-fns'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  category: { name: string; icon: string | null; color: string | null }
}

const statusConfig = {
  PAID: {
    label: 'Paid',
    icon: CheckCircle,
    class: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  },
  UNPAID: {
    label: 'Unpaid',
    icon: Clock,
    class: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertCircle,
    class: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
}

export default function BillList({ refresh }: { refresh: number }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'OVERDUE'>('ALL')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchBills()
  }, [refresh])

  const fetchBills = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bills')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBills(data)
    } catch (err) {
      console.error('Error fetching bills:', err)
      setBills([])
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/bills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      })
      await fetchBills()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return
    setActionLoading(id)
    try {
      await fetch(`/api/bills/${id}`, { method: 'DELETE' })
      await fetchBills()
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === 'ALL' ? bills : bills.filter(b => b.status === filter)

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['ALL', 'UNPAID', 'PAID', 'OVERDUE'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? 'All' : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No bills found</p>
            <p className="text-gray-300 text-xs mt-1">Add a bill using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(bill => {
              const status = statusConfig[bill.status]
              const StatusIcon = status.icon
              const isLoading = actionLoading === bill.id
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base">
                      {bill.category.icon ?? '📄'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.title}</p>
                      <p className="text-xs text-gray-400">
                        Due {format(new Date(bill.dueDate), 'MMM d, yyyy')} · {bill.category.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.class}`}>
                      <StatusIcon size={11} />
                      {status.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[70px] text-right">
                      ₱{bill.amount.toLocaleString()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 ml-2">
                      {bill.status !== 'PAID' && (
                        <button
                          onClick={() => handleMarkPaid(bill.id)}
                          disabled={isLoading}
                          title="Mark as paid"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950 transition-colors disabled:opacity-50"
                        >
                          <CheckCheck size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(bill.id)}
                        disabled={isLoading}
                        title="Delete bill"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}