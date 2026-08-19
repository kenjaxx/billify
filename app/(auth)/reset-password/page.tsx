'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FloatingInput } from '@/components/ui/floating-input'

const glassCard: React.CSSProperties = {
  background: 'rgba(22,27,39,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '16px',
  width: '100%',
  boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
}

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
        width: '24px', height: '24px',
        border: '2px solid rgba(59,130,246,0.3)',
        borderTop: '2px solid #3b82f6',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      }} />
    )
  }

  if (invalid) {
    return (
      <div style={{ ...glassCard, maxWidth: '400px', padding: '40px 36px', textAlign: 'center' }}>
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
    )
  }

  if (success) {
    return (
      <div style={{ ...glassCard, maxWidth: '400px', padding: '40px 36px', textAlign: 'center' }}>
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
    )
  }

  return (
    <div style={{ ...glassCard, maxWidth: '380px', padding: '36px' }}>
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

      <FloatingInput
        id="reset-password"
        label="New password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
      />

      <FloatingInput
        id="reset-confirm-password"
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        autoComplete="new-password"
      />

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
  )
}