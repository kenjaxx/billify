'use client'

import { useEffect, useRef, useState } from 'react'
import { Sun, Moon, LogOut, User, ChevronDown, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'

function LogoutConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', padding: '24px',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px',
          background: 'rgba(248,113,113,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
        }}>
          <AlertTriangle size={20} color="#f87171" />
        </div>
        <h2 style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>Sign out?</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
          You will be returned to the login screen.
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

export default function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'User',
          email: data.user.email ?? '',
        })
      }
    })
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      <style>{`
        .topbar {
          display: none;
        }
        @media (min-width: 768px) {
          .topbar {
            display: flex !important;
            position: fixed;
            top: 0;
            right: 0;
            left: 220px;
            height: 56px;
            z-index: 30;
            background: var(--topbar-bg);
            border-bottom: 0.5px solid var(--border);
            align-items: center;
            justify-content: flex-end;
            padding: 0 28px;
            gap: 8px;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="topbar">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: '34px', height: '34px', borderRadius: '8px',
            border: '0.5px solid var(--border)',
            background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Profile menu */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '34px', padding: '0 10px 0 4px',
              borderRadius: '8px',
              border: '0.5px solid var(--border)',
              background: open ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', color: '#fff', flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{
              fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)',
              maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name ?? '—'}
            </span>
            <ChevronDown size={13} color="var(--text-muted)" style={{
              transition: 'transform 0.15s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0,
            }} />
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: '220px',
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              animation: 'dropIn 0.12s ease',
            }}>
              {/* User info header */}
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '600', color: '#fff', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                <button disabled style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '8px',
                  background: 'transparent', border: 'none',
                  fontSize: '13px', color: 'var(--text-muted)',
                  cursor: 'not-allowed', opacity: 0.5, textAlign: 'left',
                }}>
                  <User size={14} />
                  Profile
                  <span style={{
                    marginLeft: 'auto', fontSize: '10px',
                    color: 'var(--text-muted)', background: 'var(--bg-tertiary)',
                    padding: '2px 6px', borderRadius: '4px',
                  }}>Soon</span>
                </button>

                <button
                  onClick={() => { toggleTheme(); setOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '8px',
                    background: 'transparent', border: 'none',
                    fontSize: '13px', color: 'var(--text-secondary)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>

                <div style={{ height: '0.5px', background: 'var(--border)', margin: '4px 0' }} />

                <button
                  onClick={() => { setOpen(false); setShowLogout(true) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 10px', borderRadius: '8px',
                    background: 'transparent', border: 'none',
                    fontSize: '13px', color: '#f87171',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {showLogout && (
        <LogoutConfirmModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </>
  )
}