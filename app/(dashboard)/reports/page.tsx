'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Wallet, FileText } from 'lucide-react'

type ReportData = {
  monthly: { month: string; total: number }[]
  byCategory: { name: string; icon: string | null; total: number }[]
  totalSpent: number
  topCategory: { name: string; icon: string | null; total: number } | null
}

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/reports')
        const json = await res.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {monthName} {now.getFullYear()} — your spending overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Wallet size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total spent (6 months)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ₱{data?.totalSpent.toLocaleString() ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-950 flex items-center justify-center">
            <TrendingUp size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Top category</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data?.topCategory ? `${data.topCategory.icon} ${data.topCategory.name}` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
            <FileText size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg per month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              ₱{Math.round((data?.totalSpent ?? 0) / 6).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Monthly spending (last 6 months)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data?.monthly ?? []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₱${v.toLocaleString()}`} />
            <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']} />
            <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6">
          Spending by category
        </h2>
        {data?.byCategory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No data yet</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data?.byCategory ?? []}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {data?.byCategory.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  )
}