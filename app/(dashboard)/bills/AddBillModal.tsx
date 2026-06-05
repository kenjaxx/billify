'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, PenLine } from 'lucide-react'

type Category = { id: string; name: string; icon: string | null }

const inputStyle: React.CSSProperties = {
  width: '100%',
  background:'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '6px',
}

export default function AddBillModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: ''
  })

  useEffect(() => {
    if (!isOpen) return
    setCatLoading(true)
    setCatError('')
    fetch('/api/categories')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          setCatError('No categories found.')
          setCategories([])
        } else {
          setCategories(data)
        }
      })
      .catch(() => {
        setCatError('Failed to load categories.')
        setCategories([])
      })
      .finally(() => setCatLoading(false))
  }, [isOpen])

  const handleAIParse = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { parsed } = data
      setForm(prev => ({
        ...prev,
        title: parsed.title ?? '',
        amount: parsed.amount ? String(parsed.amount) : '',
        categoryId: parsed.categoryId ?? '',
        dueDate: parsed.dueDate ?? '',
      }))
      // Switch to manual so user can review and confirm
      setMode('manual')
    } catch (err) {
      console.error(err)
      setAiError('Could not parse your input. Please try again or use manual entry.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    try {
      await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      setForm({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })
      setAiText('')
      setMode('ai')
      onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '' })
    setAiText('')
    setAiError('')
    setMode('ai')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', padding: '24px',
    }}>
      
        <div style={{
          background: 'var(--bg-card)',
          border: '0.5px solid var(--border-input)',
          borderRadius: '16px', padding: '28px',
          width: '100%', maxWidth: '440px',
          maxHeight: '90vh',        
          overflowY: 'auto',       
        }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Add new bill</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: '6px',
          background: 'var(--bg-tertiary)',
          borderRadius: '10px', padding: '4px',
          marginBottom: '20px',
        }}>
          {(['ai', 'manual'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '500',
                background: mode === m ? 'var(--bg-card)' : 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'ai' ? <><Sparkles size={13} /> AI Entry</> : <><PenLine size={13} /> Manual</>}
            </button>
          ))}
        </div>

        {/* AI mode */}
        {mode === 'ai' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.6' }}>
              Describe your bill in plain text and AI will fill in the form for you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                placeholder={`Try:\n"Electricity bill 2450 due June 15"\n"internet 1299 july 1"\n"rent, 8000, june 5"`}
                value={aiText}
                rows={4}
                onChange={e => setAiText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAIParse()
                  }
                }}
                style={{ ...inputStyle, resize: 'none', lineHeight: '1.6' }}
              />
              {aiError && (
                <p style={{ fontSize: '12px', color: '#f87171' }}>{aiError}</p>
              )}
              <button
                onClick={handleAIParse}
                disabled={aiLoading || !aiText.trim()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                  background: aiLoading || !aiText.trim() ? 'rgba(59,130,246,0.4)' : '#3b82f6',
                  color: '#fff', fontSize: '13px', fontWeight: '500',
                  cursor: aiLoading || !aiText.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {aiLoading
                  ? <><div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Parsing...</>
                  : <><Sparkles size={13} /> Parse with AI</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Manual / review form */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'manual' && form.title && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(52,211,153,0.08)',
                border: '0.5px solid rgba(52,211,153,0.2)',
              }}>
                <Sparkles size={12} color="#34d399" />
                <p style={{ fontSize: '12px', color: '#34d399' }}>AI filled the form — review and confirm</p>
              </div>
            )}
            <div>
              <label style={labelStyle}>Bill title</label>
              <input type="text" placeholder="e.g. Electricity Bill" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Amount (₱)</label>
              <input type="number" placeholder="0.00" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              {catLoading ? (
                <div style={{ ...inputStyle, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', border: '2px solid rgba(59,130,246,0.3)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Loading...
                </div>
              ) : catError ? (
                <div style={{ fontSize: '12px', color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px' }}>
                  {catError}
                </div>
              ) : (
                <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input type="date" value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                style={{ ...inputStyle, colorScheme: 'inherit' }} />
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea placeholder="Any additional notes..." value={form.notes} rows={2}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="recurring" checked={form.isRecurring}
                onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))}
                style={{ accentColor: '#3b82f6' }} />
              <label htmlFor="recurring" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Recurring monthly bill
              </label>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        {mode === 'manual' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={handleClose} style={{
              flex: 1, background: 'transparent',
              border: '0.5px solid var(--border-strong)',
              color: 'var(--text-secondary)', borderRadius: '8px',
              padding: '10px', fontSize: '13px', cursor: 'pointer',
            }}>Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.title || !form.amount || !form.categoryId || !form.dueDate}
              style={{
                flex: 1,
                background: (loading || !form.title || !form.amount || !form.categoryId || !form.dueDate) ? 'rgba(59,130,246,0.4)' : '#3b82f6',
                border: 'none', color: '#fff', borderRadius: '8px',
                padding: '10px', fontSize: '13px', fontWeight: '500',
                cursor: (loading || !form.title || !form.amount || !form.categoryId || !form.dueDate) ? 'not-allowed' : 'pointer',
              }}
            >{loading ? 'Saving...' : 'Add Bill'}</button>
          </div>
        )}
      </div>
    </div>
  )
}