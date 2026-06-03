'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Wallet,
  BarChart2,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bills', href: '/bills', icon: FileText },
  { label: 'Budgets', href: '/budgets', icon: Wallet },
  { label: 'Reports', href: '/reports', icon: BarChart2 },
]

function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '0.5px solid var(--border)',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: 'rgba(248,113,113,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <AlertTriangle size={20} color="#f87171" />
        </div>
        <h2 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Sign out?
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          You'll be returned to the login screen. Any unsaved changes will be lost.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, background: 'rgba(248,113,113,0.15)',
            border: '0.5px solid rgba(248,113,113,0.25)',
            color: '#f87171', borderRadius: '8px',
            padding: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>Sign out</button>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <aside
        id="app-sidebar"
        style={{
          width: '220px',
          height: '100vh',
          position: 'fixed',
          top: 0, left: 0,
          background: 'var(--bg-tertiary)',
          borderRight: '0.5px solid var(--border)',
          padding: '20px 12px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 40,
          display: 'none',
        }}
      >
        {/* TOP: logo + nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <div style={{
            fontSize: '20px', fontWeight: '500', color: 'var(--text-primary)',
            padding: '8px 12px', marginBottom: '20px', letterSpacing: '-0.5px',
          }}>
            Bill<span style={{ color: 'var(--accent)' }}>ify</span>
          </div>

          <div style={{
            fontSize: '10px', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.8px',
            padding: '4px 12px', marginBottom: '4px',
          }}>
            Menu
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: active ? '500' : '400',
                  color: active ? '#60a5fa' : 'var(--text-secondary)',
                  background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* BOTTOM: logout (mobile only — desktop uses TopBar) */}
        <div>
          <div style={{
            height: '0.5px', background: 'var(--border)',
            margin: '0 4px 10px',
          }} />
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px',
              fontSize: '13px', color: 'var(--text-muted)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', width: '100%', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#f87171'
              e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <style>{`
        @media (min-width: 768px) {
          #app-sidebar { display: flex !important; }
        }
      `}</style>

      {showConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogout}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}