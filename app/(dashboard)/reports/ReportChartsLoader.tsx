'use client'

import dynamic from 'next/dynamic'

type ReportChartsProps = {
  data: {
    monthly: { month: string; total: number }[]
    byCategory: { name: string; icon: string | null; total: number }[]
  }
}

const ReportCharts = dynamic<ReportChartsProps>(() => import('./ReportCharts'), {
  ssr: false,
  loading: () => (
    <div style={{
      background: 'var(--bg-card)', border: '0.5px solid var(--border)',
      borderRadius: '12px', padding: '20px', height: '260px',
    }} />
  ),
})

export default function ReportChartsLoader(props: ReportChartsProps) {
  return <ReportCharts {...props} />
}