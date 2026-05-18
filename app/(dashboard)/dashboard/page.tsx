import { FileText, Wallet, AlertCircle, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const bills = await prisma.bill.findMany({
    where: {
      userId: 'temp-user-id',
      dueDate: { gte: startOfMonth, lte: endOfMonth },
    },
  })

  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
  const paidBills = bills.filter(b => b.status === 'PAID').length
  const unpaidBills = bills.filter(b => b.status === 'UNPAID').length
  const totalBills = bills.length

  const upcomingBills = await prisma.bill.findMany({
    where: {
      userId: 'temp-user-id',
      status: { not: 'PAID' },
      dueDate: { gte: now },
    },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  const statCards = [
    {
      label: 'Total this month',
      value: `₱${totalAmount.toLocaleString()}`,
      icon: Wallet,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Unpaid bills',
      value: String(unpaidBills),
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: 'Paid bills',
      value: String(paidBills),
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Total bills',
      value: String(totalBills),
      icon: FileText,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {monthName} {year} — overview of your bills
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Bills */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming bills
        </h2>
        {upcomingBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText size={36} className="text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No upcoming bills</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm">
                    {bill.category.icon ?? '📄'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.title}</p>
                    <p className="text-xs text-gray-400">
                      Due {new Date(bill.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  ₱{bill.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Spending */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Monthly spending
        </h2>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Wallet size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Charts coming soon</p>
          <p className="text-gray-300 text-xs mt-1">Will be available in the Reports page</p>
        </div>
      </div>

    </div>
  )
}