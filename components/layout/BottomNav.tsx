'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Wallet, BarChart2 } from 'lucide-react'

const navItems = [
  { label: 'Home',    href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bills',   href: '/bills',     icon: FileText },
  { label: 'Budgets', href: '/budgets',   icon: Wallet },
  { label: 'Reports', href: '/reports',   icon: BarChart2 },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--bg-tertiary)',
      borderTop: '0.5px solid var(--border)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: '64px', padding: '0 8px',
    }} className="md:hidden">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              fontSize: '10px',
              color: active ? '#60a5fa' : 'var(--text-muted)',
              textDecoration: 'none', padding: '8px 16px', borderRadius: '8px',
              background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}