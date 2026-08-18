import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './button'

type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: EmptyStateAction
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '56px 24px', gap: '4px',
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '14px',
        background: 'var(--icon-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '14px',
      }}>
        <Icon size={24} color="var(--text-muted)" />
      </div>
      <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{title}</p>
      {description && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', lineHeight: '1.6' }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: '16px' }}>
          {action.href ? (
            <Button asChild size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}