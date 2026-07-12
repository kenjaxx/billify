'use client'

import { useEffect, useState } from 'react'
import { Sparkles, AlertTriangle, CheckCircle2, Info, RefreshCw } from 'lucide-react'

type Insight = { type: 'warning' | 'success' | 'info'; message: string }

const CACHE_KEY = 'billify-insights-cache'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

const iconFor = {
  warning: { Icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  success: { Icon: CheckCircle2, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  info:    { Icon: Info,          color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
}

export default function InsightsWidget() {
  const [insights, setInsights] = useState<Insight[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFromCache = (): { insights: Insight[]; generatedAt: string } | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (Date.now() - new Date(parsed.generatedAt).getTime() > CACHE_TTL_MS) return null
      return parsed
    } catch {
      return null
    }
  }

  const fetchInsights = async (force = false) => {
    if (!force) {
      const cached = loadFromCache()
      if (cached) {
        setInsights(cached.insights)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/insights')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load insights')
      setInsights(data.insights ?? [])
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        insights: data.insights ?? [],
        generatedAt: data.generatedAt ?? new Date().toISOString(),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load insights.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInsights() }, [])

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '0.5px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={15} color="#a78bfa" />
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
            AI Insights
          </h2>
        </div>
        <button
          onClick={() => fetchInsights(true)}
          disabled={loading}
          title="Refresh insights"
          aria-label="Refresh insights"
          style={{
            width: '26px', height: '26px', borderRadius: '6px', border: 'none',
            background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: '40px', borderRadius: '8px',
              background: 'var(--bg-hover)',
              animation: 'pulse 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
      ) : error ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{error}</p>
      ) : !insights || insights.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '6px' }}>
          <Sparkles size={24} color="var(--text-faint)" />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not enough data yet for insights</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {insights.map((insight, i) => {
            const { Icon, color, bg } = iconFor[insight.type]
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '8px', background: bg,
              }}>
                <Icon size={14} color={color} style={{ marginTop: '1px', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {insight.message}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  )
}