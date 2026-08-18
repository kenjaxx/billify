import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

export function TrendBadge({ percent, invert = false }: { percent: number | null; invert?: boolean }) {
  if (percent === null || !Number.isFinite(percent)) return null

  const rounded = Math.round(percent)
  const isFlat = rounded === 0
  const isUp = rounded > 0
  // By default "up" (spending more) is bad -> red. Pass invert for
  // metrics where "up" is good.
  const isGood = invert ? isUp : !isUp
  const color = isFlat ? 'var(--text-muted)' : isGood ? '#34d399' : '#f87171'
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      fontSize: '11px', fontWeight: '600', color,
    }}>
      <Icon size={11} />
      {Math.abs(rounded)}% vs last month
    </span>
  )
}