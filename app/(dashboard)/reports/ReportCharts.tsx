'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

const COLORS = ['#3b82f6', '#fbbf24', '#34d399', '#a78bfa', '#f87171', '#06b6d4']

type ReportData = {
  monthly: { month: string; total: number }[]
  byCategory: { name: string; icon: string | null; total: number }[]
}

export default function ReportCharts({ data, periodLabel = 'last 6 months' }: { data: ReportData; periodLabel?: string }) {
  return (
    <>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '20px' }}>
          Monthly spending ({periodLabel})
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${v.toLocaleString()}`} />
            <Tooltip
              contentStyle={{ background: 'var(--tooltip-bg)', border: '0.5px solid var(--border-strong)', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '20px' }}>
          Spending by category
        </h2>
        {data.byCategory.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No data yet"
            description="Once you add bills, your spending breakdown by category shows up here."
            action={{ label: 'Add a bill', href: '/bills?add=1' }}
          />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.byCategory}
                dataKey="total" nameKey="name"
                cx="50%" cy="50%" outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--tooltip-bg)', border: '0.5px solid var(--border-strong)', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Total']}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  )
}