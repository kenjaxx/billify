'use client'

import { useRef } from 'react'
import { Pipette } from 'lucide-react'

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F87171',
  '#F59E0B', '#FBBF24', '#34D399', '#10B981',
  '#06B6D4', '#64748B', '#F97316', '#A3A3A3',
]

export function ColorSwatchPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const customInputRef = useRef<HTMLInputElement>(null)
  const isCustom = !PRESET_COLORS.some(c => c.toLowerCase() === value.toLowerCase())

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
      {PRESET_COLORS.map(color => {
        const active = color.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={color}
            aria-label={`Use color ${color}`}
            style={{
              width: '26px', height: '26px', borderRadius: '8px',
              background: color, cursor: 'pointer',
              border: active ? '2px solid var(--text-primary)' : '2px solid transparent',
              transition: 'transform 0.1s',
            }}
          />
        )
      })}

      <button
        type="button"
        onClick={() => customInputRef.current?.click()}
        title="Custom color"
        aria-label="Pick a custom color"
        style={{
          width: '26px', height: '26px', borderRadius: '8px',
          background: isCustom ? value : 'var(--bg-input)',
          border: isCustom ? '2px solid var(--text-primary)' : '1px dashed var(--border-strong)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}
      >
        {!isCustom && <Pipette size={12} color="var(--text-muted)" />}
        <input
          ref={customInputRef}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
      </button>
    </div>
  )
}