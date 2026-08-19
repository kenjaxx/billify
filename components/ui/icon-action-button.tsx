// components/ui/icon-action-button.tsx
'use client'

import { LucideIcon } from 'lucide-react'

type Tone = 'default' | 'success' | 'info' | 'danger'

const toneStyles: Record<Tone, { color: string; border: string; hoverBg: string }> = {
  default: { color: 'var(--text-secondary)', border: 'var(--border-strong)', hoverBg: 'var(--bg-hover)' },
  success: { color: '#34d399', border: 'rgba(52,211,153,0.35)', hoverBg: 'rgba(52,211,153,0.1)' },
  info:    { color: '#60a5fa', border: 'rgba(59,130,246,0.35)', hoverBg: 'rgba(59,130,246,0.1)' },
  danger:  { color: '#f87171', border: 'rgba(248,113,113,0.35)', hoverBg: 'rgba(248,113,113,0.1)' },
}

export function IconActionButton({
  icon: Icon,
  tone = 'default',
  label,
  onClick,
  disabled = false,
  size = 14,
}: {
  icon: LucideIcon
  tone?: Tone
  label: string
  onClick: () => void
  disabled?: boolean
  size?: number
}) {
  const t = toneStyles[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="icon-action-btn"
      style={{
        '--icon-color': t.color,
        '--icon-border': t.border,
        '--icon-hover-bg': t.hoverBg,
      } as React.CSSProperties}
    >
      <Icon size={size} />
    </button>
  )
}