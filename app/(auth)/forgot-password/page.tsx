'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const glassCard: React.CSSProperties = {
  background: 'rgba(22,27,39,0.55)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '16px',
  width: '100%',
  boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) console.error(error)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ ...glassCard, maxWidth: '400px', padding: '40px 36px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', background: 'rgba(59,130,246,0.15)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '24px',
        }}>
          ✉️
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
          Check your email
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '20px' }}>
          If an account exists for <strong style={{ color: '#60a5fa' }}>{email}</strong>, we've sent a link to reset your password.
        </p>
        <a href="/login" style={{
          display: 'inline-block', background: '#3b82f6', color: '#fff',
          border: 'none', borderRadius: '8px', padding: '10px 28px',
          fontSize: '13px', fontWeight: '500', textDecoration: 'none',
        }}>
          Back to Sign In
        </a>
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
          Reset your password
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

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
          Email
        </label>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{
            width: '100%', background: 'rgba(10,12,16,0.5)',
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
        {loading ? 'Sending...' : 'Send reset link'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
        Remembered your password?{' '}
        <a href="/login" style={{ color: '#60a5fa' }}>Sign in</a>
      </p>
    </div>
  )
}