import { FileText, Wallet, AlertCircle, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const year = now.getFullYear()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const bills = await prisma.bill.findMany({
    where: {
      userId: user.id,
      dueDate: { gte: startOfMonth, lte: endOfMonth },
    },
  })

  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
  const paidBills = bills.filter(b => b.status === 'PAID').length
  const unpaidBills = bills.filter(b => b.status === 'UNPAID').length
  const totalBills = bills.length

  const upcomingBills = await prisma.bill.findMany({
    where: {
      userId: user.id,
      status: { not: 'PAID' },
      dueDate: { gte: now },
    },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
    take: 5,
  })

  const statCards = [
    { label: 'Total this month', value: `₱${totalAmount.toLocaleString()}`, icon: Wallet, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Unpaid bills', value: String(unpaidBills), icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    { label: 'Paid bills', value: String(paidBills), icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { label: 'Total bills', value: String(totalBills), icon: FileText, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ]

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#fff' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {monthName} {year} — overview of your bills
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: '#161b27',
            border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '12px',
            }}>
              <Icon size={16} color={color} />
            </div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>{label}</p>
            <p style={{ fontSize: '20px', fontWeight: '500', color: '#fff' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>

        {/* Upcoming Bills */}
        <div style={{
          background: '#161b27',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '16px' }}>
            Upcoming bills
          </h2>
          {upcomingBills.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '8px' }}>
              <FileText size={32} color="rgba(255,255,255,0.1)" />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>No upcoming bills</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {upcomingBills.map((bill, i) => (
                <div key={bill.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < upcomingBills.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                    }}>
                      {bill.category.icon ?? '📄'}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>{bill.title}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                        Due {new Date(bill.dueDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#fff' }}>
                    ₱{bill.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Spending placeholder */}
        <div style={{
          background: '#161b27',
          border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '16px' }}>
            Monthly spending
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '8px' }}>
            <Wallet size={32} color="rgba(255,255,255,0.1)" />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>Charts coming soon</p>
          </div>
        </div>

      </div>
    </div>
  )
}