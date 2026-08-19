'use client'

export function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  required = true,
  autoComplete,
  disabled,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  required?: boolean
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <div className="form-control">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      <label htmlFor={id}>
        {label.split('').map((char, i) => (
          <span key={i} style={{ transitionDelay: `${i * 25}ms` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </label>
    </div>
  )
}