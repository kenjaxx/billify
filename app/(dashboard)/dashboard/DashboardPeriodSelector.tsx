'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Period = 'thisMonth' | 'custom' | 'allTime'

const periodOptions: { value: Period; label: string }[] = [
  { value: 'thisMonth', label: 'This Month' },
  { value: 'allTime', label: 'All Time' },
  { value: 'custom', label: 'Choose Month' },
]

export default function DashboardPeriodSelector({
  period,
  month,
  year,
}: {
  period: Period
  month: number
  year: number
}) {
  const router = useRouter()

  const setPeriod = (value: Period) => {
    if (value === 'custom') {
      router.push(`/dashboard?period=custom&month=${month}&year=${year}`)
    } else {
      router.push(`/dashboard?period=${value}`)
    }
  }

  const goToMonth = (m: number, y: number) => {
    router.push(`/dashboard?period=custom&month=${m}&year=${y}`)
  }

  const prevMonth = () => {
    if (month === 1) goToMonth(12, year - 1)
    else goToMonth(month - 1, year)
  }
  const nextMonth = () => {
    if (month === 12) goToMonth(1, year + 1)
    else goToMonth(month + 1, year)
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
        borderRadius: '10px', padding: '4px',
      }}>
        {periodOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            style={{
              padding: '7px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '12px', fontWeight: '500',
              background: period === opt.value ? 'var(--bg-card)' : 'transparent',
              color: period === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: period === opt.value ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '4px 6px',
        }}>
          <button onClick={prevMonth} aria-label="Previous month" style={{
            width: '26px', height: '26px', borderRadius: '6px',
            border: '0.5px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
          }}>
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '110px', textAlign: 'center' }}>
            {monthLabel} {year}
          </span>
          <button onClick={nextMonth} aria-label="Next month" style={{
            width: '26px', height: '26px', borderRadius: '6px',
            border: '0.5px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
          }}>
            <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}