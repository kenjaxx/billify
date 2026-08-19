'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Period = 'last6months' | 'thisYear' | 'allTime'

const periodOptions: { value: Period; label: string }[] = [
  { value: 'last6months', label: 'Last 6 Months' },
  { value: 'thisYear', label: 'By Year' },
  { value: 'allTime', label: 'All Time' },
]

export default function ReportsPeriodSelector({ period, year }: { period: Period; year: number }) {
  const router = useRouter()

  const setPeriod = (value: Period) => {
    if (value === 'thisYear') router.push(`/reports?period=thisYear&year=${year}`)
    else router.push(`/reports?period=${value}`)
  }

  const goToYear = (y: number) => router.push(`/reports?period=thisYear&year=${y}`)

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

      {period === 'thisYear' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--bg-card)', border: '0.5px solid var(--border)',
          borderRadius: '10px', padding: '4px 6px',
        }}>
          <button onClick={() => goToYear(year - 1)} aria-label="Previous year" style={{
            width: '26px', height: '26px', borderRadius: '6px',
            border: '0.5px solid var(--border-strong)', background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
          }}>
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'center' }}>
            {year}
          </span>
          <button onClick={() => goToYear(year + 1)} aria-label="Next year" style={{
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