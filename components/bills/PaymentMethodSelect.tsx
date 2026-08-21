// components/bills/PaymentMethodSelect.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { PAYMENT_METHODS, getPaymentMethodMeta } from '@/lib/payment-methods'
import type { PaymentMethod } from '@/lib/payment-method-values'

export default function PaymentMethodSelect({
  value,
  onChange,
  disabled = false,
  variant = 'form',
  placeholder = 'No payment method',
}: {
  value: PaymentMethod | null
  onChange: (value: PaymentMethod | null) => void
  disabled?: boolean
  variant?: 'form' | 'compact'
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = getPaymentMethodMeta(value)
  const isCompact = variant === 'compact'
  const SelectedIcon = selected?.icon

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (method: PaymentMethod | null) => {
    onChange(method)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: isCompact ? 'auto' : '100%' }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          width: isCompact ? 'auto' : '100%',
          background: isCompact ? (selected ? `${selected.color}18` : 'var(--bg-input)') : 'var(--bg-input)',
          border: isCompact
            ? `0.5px solid ${selected ? `${selected.color}40` : 'var(--border-input)'}`
            : '0.5px solid var(--border-input)',
          borderRadius: isCompact ? '99px' : '8px',
          padding: isCompact ? '5px 10px' : '10px 14px',
          fontSize: isCompact ? '11px' : '13px',
          fontWeight: isCompact ? 500 : 400,
          color: selected ? (isCompact ? selected.color : 'var(--text-primary)') : 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
        }}
      >
        {SelectedIcon && <SelectedIcon size={isCompact ? 11 : 14} />}
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          flex: isCompact ? 'none' : 1, textAlign: 'left',
        }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={isCompact ? 10 : 13} style={{
          flexShrink: 0, marginLeft: 'auto', opacity: 0.6,
          transition: 'transform 0.15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)',
          left: isCompact ? 'auto' : 0,
          right: isCompact ? 0 : 'auto',
          minWidth: isCompact ? '180px' : '100%',
          width: isCompact ? 'max-content' : '100%',
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border)',
          borderRadius: '10px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          zIndex: 40,
          animation: 'dropIn 0.12s ease',
        }}>
          <div style={{ padding: '4px', maxHeight: '260px', overflowY: 'auto' }}>
            <button type="button" onClick={() => handleSelect(null)} style={optionStyle(value === null)}>
              <X size={13} color="var(--text-muted)" />
              <span style={{ flex: 1, textAlign: 'left' }}>No payment method</span>
              {value === null && <Check size={13} color="var(--accent)" />}
            </button>

            <div style={{ height: '0.5px', background: 'var(--border)', margin: '4px 6px' }} />

            {PAYMENT_METHODS.map(method => {
              const Icon = method.icon
              const active = value === method.value
              return (
                <button key={method.value} type="button" onClick={() => handleSelect(method.value)} style={optionStyle(active)}>
                  <span style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: `${method.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={12} color={method.color} />
                  </span>
                  <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-primary)' }}>{method.label}</span>
                  {active && <Check size={13} color="var(--accent)" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function optionStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
    padding: '8px 10px', borderRadius: '7px', border: 'none',
    background: active ? 'var(--bg-hover)' : 'transparent',
    fontSize: '12px', color: 'var(--text-secondary)',
    cursor: 'pointer', textAlign: 'left',
  }
}