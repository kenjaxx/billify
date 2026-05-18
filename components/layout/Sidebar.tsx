'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, Wallet, BarChart2, Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bills', href: '/bills', icon: FileText },
  { label: 'Budgets', href: '/budgets', icon: Wallet },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--bg-tertiary)',
      borderRight: '0.5px solid var(--border)',
      padding: '20px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flexShrink: 0,
    }} className="hidden md:flex">

      {/* Logo */}
      <div style={{
        fontSize: '20px',
        fontWeight: '500',
        color: '#fff',
        padding: '8px 12px',
        marginBottom: '20px',
        letterSpacing: '-0.5px',
      }}>
        Bill<span style={{ color: 'var(--accent)' }}>ify</span>
      </div>

      {/* Nav label */}
      <div style={{
        fontSize: '10px',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        padding: '4px 12px',
        marginBottom: '4px',
      }}>
        Menu
      </div>

      {/* Nav items */}
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: active ? '500' : '400',
              color: active ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        )
      })}

      {/* Settings at bottom */}
      <Link
        href="/settings"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.4)',
          marginTop: 'auto',
          textDecoration: 'none',
          transition: 'all 0.15s',
        }}
      >
        <Settings size={16} />
        Settings
      </Link>
    </aside>
  )
}