// components/ui/icon-action-button.tsx
'use client'

import { LucideIcon } from 'lucide-react'

type Tone = 'default' | 'success' | 'info' | 'danger'

const toneStyles: Record<Tone, { color: string; hoverBg: string }> = {
  default: { color: 'var(--text-secondary)', hoverBg: 'var(--bg-hover)' },
  success: { color: '#34d399', hoverBg: 'rgba(52,211,153,0.12)' },
  info:    { color: '#60a5fa', hoverBg: 'rgba(59,130,246,0.12)' },
  danger:  { color: '#f87171', hoverBg: 'rgba(248,113,113,0.12)' },
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
      style={{ '--icon-color': t.color, '--icon-hover-bg': t.hoverBg } as React.CSSProperties}
    >
      <Icon size={size} />
    </button>
  )
}