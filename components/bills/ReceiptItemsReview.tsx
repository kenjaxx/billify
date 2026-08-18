// components/bills/ReceiptItemsReview.tsx
'use client'

import { useState } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme-context'

type Category = { id: string; name: string; icon: string | null }

type ParsedItem = {
  title: string | null
  amount: number | null
  dueDate: string | null
  categoryId: string | null
}

type EditableItem = ParsedItem & { included: boolean }

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input)',
  border: '0.5px solid var(--border-input)',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
}

export default function ReceiptItemsReview({
  items,
  categories,
  receiptUrl,
  receiptName,
  onDone,
  onCancel,
}: {
  items: ParsedItem[]
  categories: Category[]
  receiptUrl: string
  receiptName: string
  onDone: () => void
  onCancel: () => void
}) {
  const { theme } = useTheme()
  const fallbackCategoryId = categories[0]?.id ?? ''

  const [editableItems, setEditableItems] = useState<EditableItem[]>(
    items.map(item => ({
      title: item.title ?? '',
      amount: item.amount,
      dueDate: item.dueDate,
      categoryId: item.categoryId ?? fallbackCategoryId,
      included: true,
    }))
  )
  const [saving, setSaving] = useState(false)

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    setEditableItems(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const includedCount = editableItems.filter(it => it.included).length

  const handleCreateAll = async () => {
    const toCreate = editableItems.filter(it => it.included)
    if (toCreate.length === 0) return

    for (const item of toCreate) {
      if (!item.title || !item.amount || !item.dueDate || !item.categoryId) {
        toast.error('Please fill in every field for the bills you want to add.')
        return
      }
    }

    setSaving(true)
    let successCount = 0
    try {
      for (const item of toCreate) {
        const res = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            amount: item.amount,
            categoryId: item.categoryId,
            dueDate: item.dueDate,
            isRecurring: false,
            notes: null,
            receiptUrl,
            receiptName,
          }),
        })
        if (res.ok) successCount += 1
      }
      toast.success(`${successCount} bill${successCount !== 1 ? 's' : ''} added from your receipt.`)
      onDone()
    } catch {
      toast.error('Something went wrong while adding bills.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 12px', borderRadius: '8px',
        background: 'rgba(52,211,153,0.08)',
        border: '0.5px solid rgba(52,211,153,0.2)',
      }}>
        <Sparkles size={12} color="#34d399" />
        <p style={{ fontSize: '12px', color: '#34d399' }}>
          Found {editableItems.length} charge{editableItems.length !== 1 ? 's' : ''} on this receipt — review before adding
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
        {editableItems.map((item, i) => (
          <div key={i} style={{
            border: '0.5px solid var(--border)',
            borderRadius: '10px', padding: '12px',
            opacity: item.included ? 1 : 0.5,
            background: 'var(--bg-tertiary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={item.included}
                  onChange={e => updateItem(i, { included: e.target.checked })}
                  style={{ accentColor: '#3b82f6' }}
                />
                Include this bill
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Bill title"
                value={item.title ?? ''}
                disabled={!item.included}
                onChange={e => updateItem(i, { title: e.target.value })}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount ?? ''}
                  disabled={!item.included}
                  onChange={e => updateItem(i, { amount: e.target.value ? Number(e.target.value) : null })}
                  style={inputStyle}
                />
                <input
                  type="date"
                  value={item.dueDate ?? ''}
                  disabled={!item.included}
                  onChange={e => updateItem(i, { dueDate: e.target.value })}
                  style={{ ...inputStyle, colorScheme: theme }}
                />
              </div>
              <select
                value={item.categoryId ?? ''}
                disabled={!item.included}
                onChange={e => updateItem(i, { categoryId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1, background: 'transparent',
            border: '0.5px solid var(--border-strong)',
            color: 'var(--text-secondary)', borderRadius: '8px',
            padding: '10px', fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          <X size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
          Cancel
        </button>
        <button
          onClick={handleCreateAll}
          disabled={saving || includedCount === 0}
          style={{
            flex: 1,
            background: (saving || includedCount === 0) ? 'rgba(59,130,246,0.4)' : '#3b82f6',
            border: 'none', color: '#fff', borderRadius: '8px',
            padding: '10px', fontSize: '13px', fontWeight: '500',
            cursor: (saving || includedCount === 0) ? 'not-allowed' : 'pointer',
          }}
        >
          <Check size={14} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
          {saving ? 'Adding...' : `Add ${includedCount} Bill${includedCount !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}