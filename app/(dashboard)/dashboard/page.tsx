import { FileText, Wallet, AlertCircle, CheckCircle } from 'lucide-react'

const statCards = [
  {
    label: 'Total this month',
    value: '₱0.00',
    icon: Wallet,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    label: 'Unpaid bills',
    value: '0',
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
  },
  {
    label: 'Paid bills',
    value: '0',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  {
    label: 'Total bills',
    value: '0',
    icon: FileText,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
]

export default function DashboardPage() {
  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
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
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No bills yet</p>
          <p className="text-gray-300 text-xs mt-1">Add your first bill to get started</p>
        </div>
      </div>

      {/* Monthly Spending */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Monthly spending
        </h2>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Wallet size={36} className="text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No spending data yet</p>
          <p className="text-gray-300 text-xs mt-1">Data will appear once you add bills</p>
        </div>
      </div>

    </div>
  )
}