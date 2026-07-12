'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Supabase's reset-password email link lands here with a `code` param
    // (or, in older flows, a token in the URL hash). Exchanging it for a
    // session is what actually lets updateUser({ password }) work below.
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')

    const init = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setInvalid(true)
          setReady(true)
          return
        }
      } else {
        // Fallback: some Supabase configs deliver the session via hash tokens,
        // which the client picks up automatically. Just check if we ended up
        // with a session either way.
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
          setInvalid(true)
          setReady(true)
          return
        }
      }
      setReady(true)
    }

    init()
  }, [])

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f1117',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: '24px', height: '24px',
          border: '2px solid rgba(59,130,246,0.3)',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  if (invalid) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f1117',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          background: '#161b27', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '400px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
            Link expired or invalid
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '20px' }}>
            This password reset link is no longer valid. Please request a new one.
          </p>
          <a href="/forgot-password" style={{
            display: 'inline-block', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '8px', padding: '10px 28px',
            fontSize: '13px', fontWeight: '500', textDecoration: 'none',
          }}>
            Request new link
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f1117',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{
          background: '#161b27', border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '40px 36px', width: '100%', maxWidth: '400px', textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', background: 'rgba(52,211,153,0.15)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '24px',
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
            Password updated
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
            Redirecting you to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: '#161b27', border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '36px', width: '100%', maxWidth: '380px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#fff', letterSpacing: '-0.5px' }}>
            Bill<span style={{ color: '#3b82f6' }}>ify</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
            Choose a new password
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '0.5px solid rgba(248,113,113,0.2)',
            borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#f87171', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
            New password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', background: '#0a0c10',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#fff', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
            Confirm new password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={{
              width: '100%', background: '#0a0c10',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#fff', outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '11px', fontSize: '14px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </div>
    </div>
  )
}