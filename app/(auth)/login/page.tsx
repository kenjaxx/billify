'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FloatingInput } from '@/components/ui/floating-input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')

    await supabase.auth.signOut()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setError('Your email address has not been confirmed yet. Please check your inbox and click the confirmation link.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name ?? null,
        }),
      })
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={{
      background: 'rgba(22,27,39,0.55)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '16px',
      padding: '36px',
      width: '100%',
      maxWidth: '380px',
      boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '500', color: '#fff', letterSpacing: '-0.5px' }}>
          Bill<span style={{ color: '#3b82f6' }}>ify</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
          Sign in to your account
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
          lineHeight: '1.5',
        }}>
          {error}
        </div>
      )}

      <FloatingInput
        id="login-email"
        label="Email"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
      />

      <FloatingInput
        id="login-password"
        label="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleLogin()}
        autoComplete="current-password"
      />

      <div style={{ textAlign: 'right', marginBottom: '20px', marginTop: '-10px' }}>
        <a href="/forgot-password" style={{ fontSize: '11px', color: '#60a5fa' }}>
          Forgot password?
        </a>
      </div>

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: '100%',
          background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '11px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
        Don't have an account?{' '}
        <a href="/register" style={{ color: '#60a5fa' }}>Register</a>
      </p>
    </div>
  )
}