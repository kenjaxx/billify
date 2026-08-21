import { redirect } from 'next/navigation'
import { TrendingUp, Wallet, FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getPaymentMethodMeta } from '@/lib/payment-methods'
import ReportChartsLoader from './ReportChartsLoader'
import ReportsPeriodSelector from './ReportsPeriodSelector'
import { TrendBadge } from '@/components/ui/trend-badge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type SearchParams = { period?: string; year?: string }
type Period = 'last6months' | 'thisYear' | 'allTime'

function resolvePeriod(sp: SearchParams) {
  const now = new Date()
  const period: Period = sp.period === 'thisYear' ? 'thisYear' : sp.period === 'allTime' ? 'allTime' : 'last6months'

  let year = now.getFullYear()
  if (period === 'thisYear') {
    const y = Number(sp.year)
    if (Number.isInteger(y) && y >= 2000 && y <= 2100) year = y
  }

  return { period, year }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sp = await searchParams
  const { period, year } = resolvePeriod(sp)
  const now = new Date()

  let dateWhere: { gte?: Date; lte?: Date } | undefined

  if (period === 'last6months') {
    dateWhere = { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
  } else if (period === 'thisYear') {
    dateWhere = { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) }
  } else {
    dateWhere = undefined // allTime — no date filter
  }

  const bills = await prisma.bill.findMany({
    where: { userId: user.id, ...(dateWhere ? { dueDate: dateWhere } : {}) },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
  })

  const monthlyData: Record<string, number> = {}

  if (period === 'last6months') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthlyData[d.toLocaleString('default', { month: 'short', year: 'numeric' })] = 0
    }
  } else if (period === 'thisYear') {
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1)
      monthlyData[d.toLocaleString('default', { month: 'short', year: 'numeric' })] = 0
    }
  }
  // allTime: don't pre-seed — only months that actually have bills will appear

  bills.forEach(bill => {
    const d = new Date(bill.dueDate)
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' })
    if (monthlyData[key] === undefined) monthlyData[key] = 0
    monthlyData[key] += bill.amount
  })

  let monthly = Object.entries(monthlyData).map(([month, total]) => ({ month, total }))
  if (period === 'allTime') {
    monthly = monthly.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  // Group by categoryId (not name) so two categories that share a name
  // never get merged into one slice of the report.
  const categoryData: Record<string, { name: string; icon: string | null; total: number }> = {}
  bills.forEach(bill => {
    const key = bill.categoryId
    if (!categoryData[key]) {
      categoryData[key] = { name: bill.category.name, icon: bill.category.icon, total: 0 }
    }
    categoryData[key].total += bill.amount
  })

  const byCategory = Object.values(categoryData).sort((a, b) => b.total - a.total)

  // Group by payment method
  const paymentData: Record<string, { name: string; color: string; total: number }> = {}
  bills.forEach(bill => {
    const meta = getPaymentMethodMeta(bill.paymentMethod)
    const key = meta ? meta.value : 'UNSPECIFIED'
    if (!paymentData[key]) {
      paymentData[key] = {
        name: meta ? meta.label : 'Not specified',
        color: meta ? meta.color : '#94a3b8',
        total: 0,
      }
    }
    paymentData[key].total += bill.amount
  })
  const byPaymentMethod = Object.values(paymentData).sort((a, b) => b.total - a.total)

  const totalSpent = bills.reduce((sum, b) => sum + b.amount, 0)
  const topCategory = byCategory[0] ?? null

  // Month-over-month trend only makes clean sense on the rolling 6-month view
  const currentMonthTotal = monthly[monthly.length - 1]?.total ?? 0
  const prevMonthTotal = monthly[monthly.length - 2]?.total ?? 0
  const monthTrend = period === 'last6months' && prevMonthTotal > 0
    ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
    : null

  const periodLabel = period === 'last6months' ? 'Last 6 months' : period === 'thisYear' ? String(year) : 'All time'
  const avgDivisor = monthly.length > 0 ? monthly.length : 1

  const summaryCards = [
    { label: `Total spent (${periodLabel})`, value: `₱${totalSpent.toLocaleString()}`, icon: Wallet, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', trend: <TrendBadge percent={monthTrend} /> },
    { label: 'Top category', value: topCategory ? `${topCategory.icon} ${topCategory.name}` : '—', icon: TrendingUp, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', trend: null },
    { label: 'Avg per month', value: `₱${Math.round(totalSpent / avgDivisor).toLocaleString()}`, icon: FileText, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', trend: null },
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: '14px', marginBottom: '28px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Reports</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {periodLabel} — your spending overview
          </p>
        </div>
        <ReportsPeriodSelector period={period} year={year} />
      </div>

      <div className="reports-summary-grid" style={{ marginBottom: '20px' }}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg, trend }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</p>
                {trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReportChartsLoader data={{ monthly, byCategory, byPaymentMethod }} periodLabel={periodLabel.toLowerCase()} />
    </div>
  )
}