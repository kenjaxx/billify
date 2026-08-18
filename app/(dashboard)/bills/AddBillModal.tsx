// app/(dashboard)/bills/AddBillModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import ReceiptUpload from '@/components/bills/ReceiptUpload'
import ReceiptItemsReview from '@/components/bills/ReceiptItemsReview'

type Category = { id: string; name: string; icon: string | null }

type ParsedItem = {
  title: string | null
  amount: number | null
  dueDate: string | null
  categoryId: string | null
}

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
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [tempBillId, setTempBillId] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)
  const [multiItems, setMultiItems] = useState<ParsedItem[] | null>(null)
  const [multiReceipt, setMultiReceipt] = useState<{ url: string; name: string } | null>(null)
  const { theme } = useTheme()
  const [form, setForm] = useState({
    title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '',
    receiptUrl: null as string | null, receiptName: null as string | null,
  })

  useEffect(() => {
    if (!isOpen) return
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    setTempBillId(crypto.randomUUID())
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
    try {
      const res = await fetch('/api/ai/parse-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to parse')

      const { parsed } = data
      const resolvedCategoryId = parsed.categoryId ?? categories[0]?.id ?? ''

      setForm(prev => ({
        ...prev,
        title: parsed.title ?? '',
        amount: parsed.amount ? String(parsed.amount) : '',
        categoryId: resolvedCategoryId,
        dueDate: parsed.dueDate ?? '',
      }))
      setAutoFilled(true)
      setMode('manual')

      if (!parsed.categoryId && categories.length > 0) {
        toast.info('Category could not be matched — please double-check it.')
      }
    } catch (err) {
      const message = err instanceof Error && err.message.includes('Too many')
        ? err.message
        : 'Could not parse your input. Please try again or use manual entry.'
      toast.error(message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleReceiptParsed = (items: ParsedItem[], receiptUrl: string, receiptName: string) => {
    if (items.length > 1) {
      setMultiItems(items)
      setMultiReceipt({ url: receiptUrl, name: receiptName })
      return
    }

    const item = items[0]
    const resolvedCategoryId = item.categoryId ?? categories[0]?.id ?? ''

    setForm(prev => ({
      ...prev,
      title: item.title ?? prev.title,
      amount: item.amount ? String(item.amount) : prev.amount,
      categoryId: resolvedCategoryId,
      dueDate: item.dueDate ?? prev.dueDate,
      receiptUrl,
      receiptName,
    }))
    setAutoFilled(true)
    setMode('manual')

    if (!item.categoryId && categories.length > 0) {
      toast.info('Category could not be matched — please double-check it.')
    } else {
      toast.success('Form filled from your receipt — review and confirm.')
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to add bill')
      }
      resetForm()
      toast.success('Bill added.')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add bill.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '', receiptUrl: null, receiptName: null })
    setAiText('')
    setAutoFilled(false)
    setMultiItems(null)
    setMultiReceipt(null)
    setMode('ai')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  if (multiItems && multiReceipt) {
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
          width: '100%', maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Multiple bills detected</h2>
            <button onClick={handleClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
          <ReceiptItemsReview
            items={multiItems}
            categories={categories}
            receiptUrl={multiReceipt.url}
            receiptName={multiReceipt.name}
            onDone={() => { resetForm(); onSuccess() }}
            onCancel={handleClose}
          />
        </div>
      </div>
    )
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Add new bill</h2>
          <button onClick={handleClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

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

        {mode === 'ai' && (
          <div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.6' }}>
              Describe your bill in plain text, or attach a receipt below — if it has multiple charges (like rent + electricity + water), AI will split them into separate bills.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <Button
                onClick={handleAIParse}
                disabled={aiLoading || !aiText.trim()}
                style={{ width: '100%' }}
              >
                {aiLoading
                  ? <><div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Parsing...</>
                  : <><Sparkles size={13} /> Parse with AI</>
                }
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
              </div>

              {userId && (
                <ReceiptUpload
                  userId={userId}
                  billId={tempBillId}
                  receiptUrl={form.receiptUrl}
                  receiptName={form.receiptName}
                  onChange={(receiptUrl, receiptName) => setForm(p => ({ ...p, receiptUrl, receiptName }))}
                  onParsed={handleReceiptParsed}
                />
              )}
            </div>
          </div>
        )}

        {mode === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {autoFilled && (
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
                style={{ ...inputStyle, colorScheme: theme }} />
            </div>
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea placeholder="Any additional notes..." value={form.notes} rows={2}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
            {userId && (
              <ReceiptUpload
                userId={userId}
                billId={tempBillId}
                receiptUrl={form.receiptUrl}
                receiptName={form.receiptName}
                onChange={(receiptUrl, receiptName) => setForm(p => ({ ...p, receiptUrl, receiptName }))}
                onParsed={handleReceiptParsed}
              />
            )}
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

        {mode === 'manual' && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <Button variant="outline" onClick={handleClose} style={{ flex: 1 }}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.title || !form.amount || !form.categoryId || !form.dueDate}
              style={{ flex: 1 }}
            >{loading ? 'Saving...' : 'Add Bill'}</Button>
          </div>
        )}
      </div>
    </div>
  )
}