'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Wallet, FileText } from 'lucide-react'

type ReportData = {
  monthly: { month: string; total: number }[]
  byCategory: { name: string; icon: string | null; total: number }[]
  totalSpent: number
  topCategory: { name: string; icon: string | null; total: number } | null
}

const COLORS = ['#3b82f6', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#06b6d4']

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [])

  const now = new Date()

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <div style={{
        width: '24px', height: '24px',
        border: '2px solid rgba(59,130,246,0.3)',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const summaryCards = [
    { label: 'Total spent (6 months)', value: `₱${(data?.totalSpent ?? 0).toLocaleString()}`, icon: Wallet, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Top category', value: data?.topCategory ? `${data.topCategory.icon} ${data.topCategory.name}` : '—', icon: TrendingUp, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    { label: 'Avg per month', value: `₱${Math.round((data?.totalSpent ?? 0) / 6).toLocaleString()}`, icon: FileText, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ]

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: '#fff' }}>Reports</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()} — your spending overview
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: '#161b27',
            border: '0.5px solid rgba(255,255,255,0.06)',
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
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px' }}>{label}</p>
              <p style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div style={{
        background: '#161b27',
        border: '0.5px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '20px' }}>
          Monthly spending (last 6 months)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data?.monthly ?? []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v.toLocaleString()}`} />
            <Tooltip
              contentStyle={{ background: '#0a0c10', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div style={{
        background: '#161b27',
        border: '0.5px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '20px' }}>
          Spending by category
        </h2>
        {(data?.byCategory.length ?? 0) === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '8px' }}>
            <FileText size={32} color="rgba(255,255,255,0.1)" />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>No data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data?.byCategory ?? []}
                dataKey="total"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data?.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0a0c10', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}