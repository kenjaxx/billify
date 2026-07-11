'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User, Sun, Moon, Save, Tags } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabase'

type SettingsData = {
  id: string
  email: string
  name: string | null
  createdAt: string | null
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const [data, setData] = useState<SettingsData | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setName(d.name ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to save')

      const { error: authError } = await supabase.auth.updateUser({ data: { name } })
      if (authError) throw new Error(authError.message)

      setMessage({ type: 'success', text: 'Settings saved.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(59,130,246,0.3)',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Manage your account and preferences
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <User size={16} color="var(--text-secondary)" />
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Profile</h2>
        </div>

        {message && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px', borderRadius: '8px',
            fontSize: '13px',
            background: message.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
            color: message.type === 'success' ? '#34d399' : '#f87171',
            border: `0.5px solid ${message.type === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '0.5px solid var(--border-input)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Email
          </label>
          <input
            type="email"
            value={data?.email ?? ''}
            disabled
            style={{
              width: '100%', background: 'var(--bg-input)',
              border: '0.5px solid var(--border-input)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: 'var(--text-muted)', outline: 'none',
              cursor: 'not-allowed',
            }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: saving || !name.trim() ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 18px', fontSize: '13px', fontWeight: '500',
            cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Appearance
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Theme</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Currently using {theme === 'dark' ? 'dark' : 'light'} mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
              borderRadius: '8px', padding: '8px 14px',
              fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Categories
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Manage categories</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Add, edit, or remove bill categories
            </p>
          </div>
          <Link href="/categories" style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-tertiary)', border: '0.5px solid var(--border)',
            borderRadius: '8px', padding: '8px 14px',
            fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none',
          }}>
            <Tags size={14} />
            Open
          </Link>
        </div>
      </div>
    </div>
  )
}