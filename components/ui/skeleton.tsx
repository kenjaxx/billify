export function Skeleton({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--bg-hover)',
        borderRadius: '8px',
        animation: 'pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}