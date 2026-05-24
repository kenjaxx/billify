'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleRegister = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        // After clicking the confirmation link, redirect to /dashboard
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // User created but email not yet confirmed
    if (data.user) {
      setEmailSent(true)
    }

    setLoading(false)
  }

  // ── Email sent screen ────────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{
          background: '#161b27',
          border: '0.5px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'rgba(59,130,246,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
          }}>
            ✉️
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
            Check your email
          </h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', marginBottom: '8px' }}>
            We sent a confirmation link to
          </p>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#60a5fa', marginBottom: '20px' }}>
            {email}
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', marginBottom: '28px' }}>
            Click the link in the email to confirm your account, then sign in. Check your spam folder if you don't see it.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 28px',
              fontSize: '13px',
              fontWeight: '500',
              textDecoration: 'none',
            }}
          >
            Back to Sign In
          </a>
        </div>
      </div>
    )
  }

  // ── Register form ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#161b27',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '36px',
        width: '100%',
        maxWidth: '380px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#fff', letterSpacing: '-0.5px' }}>
            Bill<span style={{ color: '#3b82f6' }}>ify</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
            Create your account
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '0.5px solid rgba(248,113,113,0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#f87171',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Full name</label>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', background: '#0a0c10',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#fff', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', background: '#0a0c10',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#fff', outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{
              width: '100%', background: '#0a0c10',
              border: '0.5px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#fff', outline: 'none',
            }}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%',
            background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '11px', fontSize: '14px', fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#60a5fa' }}>Sign in</a>
        </p>
      </div>
    </div>
  )
}