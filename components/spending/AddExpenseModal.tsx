// components/spending/AddExpenseModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useLockBodyScroll } from '@/lib/use-lock-body-scroll'
import { useTheme } from '@/lib/theme-context'

type Category = { id: string; name: string; icon: string | null }
type BudgetOption = { id: string; name: string | null; categoryId: string }

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

function toLocalDateTimeInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  month,
  year,
  defaultCategoryId,
  defaultBudgetId,
  editExpense,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  month: number
  year: number
  defaultCategoryId?: string
  defaultBudgetId?: string | null
  editExpense?: { id: string; amount: number; note: string | null; categoryId: string; spentAt: string; budgetId?: string | null } | null
}) {
  const { theme } = useTheme()
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [budgetOptions, setBudgetOptions] = useState<BudgetOption[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    note: '',
    categoryId: defaultCategoryId ?? '',
    budgetId: (defaultBudgetId ?? '') as string,
    spentAt: toLocalDateTimeInputValue(new Date()),
  })

  const isEdit = !!editExpense

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    setCatLoading(true)
    fetch('/api/categories')
      .then(r => r.json())
      .then((data: (Category & { type?: string })[]) => {
        setCategories(data.filter(c => c.type === 'SPENDING'))
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false))

    // Pull this month's budgets so the category picker can offer a
    // "which envelope is this for" dropdown when one exists.
    fetch(`/api/budgets?month=${month}&year=${year}`)
      .then(r => r.json())
      .then((data: { id: string; name: string | null; categoryId: string }[]) => {
        setBudgetOptions(Array.isArray(data) ? data.map(b => ({ id: b.id, name: b.name, categoryId: b.categoryId })) : [])
      })
      .catch(() => setBudgetOptions([]))

    if (editExpense) {
      setForm({
        amount: String(editExpense.amount),
        note: editExpense.note ?? '',
        categoryId: editExpense.categoryId,
        budgetId: editExpense.budgetId ?? '',
        spentAt: toLocalDateTimeInputValue(new Date(editExpense.spentAt)),
      })
    } else {
      setForm({
        amount: '',
        note: '',
        categoryId: defaultCategoryId ?? '',
        budgetId: defaultBudgetId ?? '',
        spentAt: toLocalDateTimeInputValue(new Date()),
      })
    }
  }, [isOpen, defaultCategoryId, defaultBudgetId, editExpense, month, year])

  const envelopesForCategory = budgetOptions.filter(b => b.categoryId === form.categoryId)

  const handleCategoryChange = (categoryId: string) => {
    // Switching category invalidates whatever envelope was picked.
    setForm(p => ({ ...p, categoryId, budgetId: '' }))
  }

  const handleSubmit = async () => {
    if (!form.amount || !form.categoryId) return
    setLoading(true)
    try {
      const url = isEdit ? `/api/expenses/${editExpense!.id}` : '/api/expenses'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          note: form.note || null,
          categoryId: form.categoryId,
          budgetId: form.budgetId || null,
          spentAt: new Date(form.spentAt).toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save expense')
      toast.success(isEdit ? 'Expense updated.' : 'Expense logged.')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '400px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit expense' : 'Log an expense'}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Category</label>
            {catLoading ? (
              <div style={{ ...inputStyle, color: 'var(--text-muted)' }}>Loading...</div>
            ) : categories.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#f87171', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px' }}>
                No spending categories yet. Create one (e.g. Groceries) marked as "Ongoing Spending" first.
              </div>
            ) : (
              <select value={form.categoryId} onChange={e => handleCategoryChange(e.target.value)} style={inputStyle}>
                <option value="">Select category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
              </select>
            )}
          </div>

          {form.categoryId && envelopesForCategory.length > 0 && (
            <div>
              <label style={labelStyle}>Which budget is this for?</label>
              <select value={form.budgetId} onChange={e => setForm(p => ({ ...p, budgetId: e.target.value }))} style={inputStyle}>
                <option value="">No specific budget</option>
                {envelopesForCategory.map(b => (
                  <option key={b.id} value={b.id}>{b.name ?? 'General'}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Amount (₱)</label>
            <input type="number" placeholder="0.00" value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Where did you spend it?</label>
            <input type="text" placeholder="e.g. SM Supermarket, Grab, Palengke" value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date & time</label>
            <input type="datetime-local" value={form.spentAt}
              onChange={e => setForm(p => ({ ...p, spentAt: e.target.value }))}
              style={{ ...inputStyle, colorScheme: theme }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.amount || !form.categoryId || categories.length === 0}
            style={{ flex: 1 }}
          >
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Log expense'}
          </Button>
        </div>
      </div>
    </div>
  )
}