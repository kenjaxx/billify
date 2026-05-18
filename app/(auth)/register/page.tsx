'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

const handleRegister = async () => {
  setLoading(true)
  setError('')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })
  if (error) {
    setError(error.message)
  } else if (data.user) {
    // Sync user to our database
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.user.id, email, name }),
    })
    router.push('/dashboard')
  }
  setLoading(false)
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create your Billify account</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p className="text-center text-sm mt-4 text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Login</a>
        </p>
      </div>
    </div>
  )
}