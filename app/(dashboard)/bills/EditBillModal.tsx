// app/(dashboard)/bills/EditBillModal.tsx — full replacement
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'
import ReceiptUpload from '@/components/bills/ReceiptUpload'
import PaymentMethodSelect from '@/components/bills/PaymentMethodSelect'
import type { PaymentMethod } from '@/lib/payment-method-values'

type Category = { id: string; name: string; icon: string | null }

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  categoryId: string
  isRecurring: boolean
  notes: string | null
  receiptUrl?: string | null
  receiptName?: string | null
  paymentMethod?: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
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

export default function EditBillModal({ bill, onClose, onSuccess }: {
  bill: Bill | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { theme } = useTheme()
  const [form, setForm] = useState({
    title: '', amount: '', categoryId: '', dueDate: '', isRecurring: false, notes: '',
    receiptUrl: null as string | null, receiptName: null as string | null,
    paymentMethod: null as PaymentMethod | null,
  })

  useLockBodyScroll(!!bill)

  useEffect(() => {
    if (!bill) return
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    fetch('/api/categories').then(r => r.json()).then(setCategories)
    setForm({
      title: bill.title,
      amount: String(bill.amount),
      categoryId: bill.categoryId,
      dueDate: bill.dueDate.split('T')[0],
      isRecurring: bill.isRecurring,
      notes: bill.notes ?? '',
      receiptUrl: bill.receiptUrl ?? null,
      receiptName: bill.receiptName ?? null,
      paymentMethod: (bill.paymentMethod as PaymentMethod | null) ?? null,
    })
  }, [bill])

  const handleSubmit = async () => {
    if (!bill || !form.title || !form.amount || !form.categoryId || !form.dueDate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          amount: parseFloat(form.amount),
          categoryId: form.categoryId,
          dueDate: form.dueDate,
          isRecurring: form.isRecurring,
          notes: form.notes,
          receiptUrl: form.receiptUrl,
          receiptName: form.receiptName,
          paymentMethod: form.paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update bill')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update bill.')
    } finally {
      setLoading(false)
    }
  }

  if (!bill) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>Edit bill</h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Bill title</label>
            <input type="text" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Amount (₱)</label>
            <input type="number" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))} style={inputStyle}>
              <option value="">Select category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              style={{ ...inputStyle, colorScheme: theme }} />
          </div>
          <div>
            <label style={labelStyle}>Payment method (optional)</label>
            <PaymentMethodSelect
              value={form.paymentMethod}
              onChange={pm => setForm(p => ({ ...p, paymentMethod: pm }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea value={form.notes} rows={2}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          {userId && (
            <ReceiptUpload
              userId={userId}
              billId={bill.id}
              receiptUrl={form.receiptUrl}
              receiptName={form.receiptName}
              onChange={(receiptUrl, receiptName) => setForm(p => ({ ...p, receiptUrl, receiptName }))}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="edit-recurring" checked={form.isRecurring}
              onChange={e => setForm(p => ({ ...p, isRecurring: e.target.checked }))} />
            <label htmlFor="edit-recurring" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Recurring monthly bill
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.title || !form.amount || !form.categoryId || !form.dueDate}
            style={{ flex: 1 }}
          >{loading ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </div>
    </div>
  )
}