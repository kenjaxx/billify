import { FileText, Wallet, AlertCircle, CheckCircle, CalendarClock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BillCalendar from './BillCalendar'
import InsightsWidget from './InsightsWidget'
import { TrendBadge } from '@/components/ui/trend-badge'
import { EmptyState } from '@/components/ui/empty-state'

// Always read fresh from the DB — a bill just added via receipt upload,
// AI text parsing, or manual entry must show up here immediately, never
// out of a stale cached render.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [bills, lastMonthBills, upcomingBills] = await Promise.all([
    prisma.bill.findMany({
      where: { userId: user.id, dueDate: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.bill.findMany({
      where: { userId: user.id, dueDate: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.bill.findMany({
      where: { userId: user.id, status: { not: 'PAID' }, dueDate: { gte: now } },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
      take: 5,
    }),
  ])

  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
  const paidBills = bills.filter(b => b.status === 'PAID').length
  const unpaidBills = bills.filter(b => b.status === 'UNPAID').length
  const totalBills = bills.length

  const lastMonthTotal = lastMonthBills.reduce((sum, b) => sum + b.amount, 0)
  const amountTrend = lastMonthTotal > 0 ? ((totalAmount - lastMonthTotal) / lastMonthTotal) * 100 : null
  const countTrend = lastMonthBills.length > 0 ? ((totalBills - lastMonthBills.length) / lastMonthBills.length) * 100 : null

  const statCards = [
    { label: 'Total this month', value: `₱${totalAmount.toLocaleString()}`, icon: Wallet,     color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', trend: <TrendBadge percent={amountTrend} /> },
    { label: 'Unpaid bills',     value: String(unpaidBills),               icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)', trend: null },
    { label: 'Paid bills',       value: String(paidBills),                 icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)', trend: null },
    { label: 'Total bills',      value: String(totalBills),                icon: FileText,    color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', trend: <TrendBadge percent={countTrend} invert /> },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {monthName} {year} — overview of your bills
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, trend }) => (
          <div key={label} style={{
            background: 'var(--bg-card)',
            border: '0.5px solid var(--border)',
            borderRadius: '12px', padding: '16px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '12px',
            }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)' }}>{value}</p>
              {trend}
            </div>
          </div>
        ))}
      </div>

       <div style={{ marginBottom: '20px' }}>
        <InsightsWidget />
      </div>

      <div className="dashboard-content-grid">
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Upcoming bills
          </h2>
          {upcomingBills.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="Nothing due soon"
              description="Bills you add with a future due date will show up here."
              action={{ label: 'Add a bill', href: '/bills?add=1' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcomingBills.map((bill, i) => (
                <div key={bill.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < upcomingBills.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'var(--icon-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                    }}>
                      {bill.category.icon ?? '📄'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{bill.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Due {new Date(bill.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    ₱{bill.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '12px', padding: '20px',
        }}>
         <BillCalendar />
        </div>
      </div>
    </div>
  )
}