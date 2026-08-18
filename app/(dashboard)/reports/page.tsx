import { redirect } from 'next/navigation'
import { TrendingUp, Wallet, FileText } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import ReportChartsLoader from './ReportChartsLoader'

export default async function ReportsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const bills = await prisma.bill.findMany({
    where: { userId: user.id, dueDate: { gte: sixMonthsAgo } },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
  })

  const monthlyData: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' })
    monthlyData[key] = 0
  }

  bills.forEach(bill => {
    const d = new Date(bill.dueDate)
    const key = d.toLocaleString('default', { month: 'short', year: 'numeric' })
    if (monthlyData[key] !== undefined) {
      monthlyData[key] += bill.amount
    }
  })

  const monthly = Object.entries(monthlyData).map(([month, total]) => ({ month, total }))

  const categoryData: Record<string, { name: string; icon: string | null; total: number }> = {}
  bills.forEach(bill => {
    const key = bill.categoryId
    if (!categoryData[key]) {
      categoryData[key] = { name: bill.category.name, icon: bill.category.icon, total: 0 }
    }
    categoryData[key].total += bill.amount
  })

  const byCategory = Object.values(categoryData).sort((a, b) => b.total - a.total)
  const totalSpent = bills.reduce((sum, b) => sum + b.amount, 0)
  const topCategory = byCategory[0] ?? null

  const summaryCards = [
    { label: 'Total spent (6 months)', value: `₱${totalSpent.toLocaleString()}`, icon: Wallet, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Top category', value: topCategory ? `${topCategory.icon} ${topCategory.name}` : '—', icon: TrendingUp, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { label: 'Avg per month', value: `₱${Math.round(totalSpent / 6).toLocaleString()}`, icon: FileText, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Reports</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()} — your spending overview
        </p>
      </div>

      <div className="reports-summary-grid" style={{ marginBottom: '20px' }}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
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
              <p style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <ReportChartsLoader data={{ monthly, byCategory }} />
    </div>
  )
}