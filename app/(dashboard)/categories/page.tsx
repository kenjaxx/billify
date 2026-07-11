'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import CategoryModal from '@/components/categories/CategoryModal'

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
  _count: { bills: number; budgets: number }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      setCategories(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = () => { setEditingCategory(null); setModalOpen(true) }
  const handleEdit = (cat: Category) => { setEditingCategory(cat); setModalOpen(true) }

  const handleDelete = async (cat: Category) => {
    const { bills, budgets } = cat._count
    const warning = (bills > 0 || budgets > 0)
      ? `This category has ${bills} bill(s) and ${budgets} budget(s) attached. Deleting it will also delete all of them. This cannot be undone.`
      : `Delete "${cat.name}"? This cannot be undone.`

    if (!confirm(warning)) return

    setDeletingId(cat.id)
    try {
      await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      await fetchCategories()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Categories</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Organize your bills and budgets by category
          </p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#3b82f6', color: '#fff', border: 'none',
            padding: '9px 16px', borderRadius: '8px',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Add Category
        </button>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '0.5px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
            <div style={{
              width: '24px', height: '24px',
              border: '2px solid rgba(59,130,246,0.3)',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : categories.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px', gap: '8px' }}>
            <Tags size={36} color="var(--text-faint)" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No categories yet</p>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Add a category to start organizing bills</p>
          </div>
        ) : (
          categories.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < categories.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: cat.color ? `${cat.color}20` : 'var(--icon-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>
                  {cat.icon ?? '📄'}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{cat.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {cat._count.bills} bill{cat._count.bills !== 1 ? 's' : ''} · {cat._count.budgets} budget{cat._count.budgets !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {cat.color && (
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px',
                    background: cat.color, marginRight: '8px',
                    border: '0.5px solid var(--border-strong)',
                  }} />
                )}
                <button
                  onClick={() => handleEdit(cat)}
                  disabled={deletingId === cat.id}
                  title="Edit"
                  style={{
                    width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                    background: 'transparent', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  disabled={deletingId === cat.id}
                  title="Delete"
                  style={{
                    width: '30px', height: '30px', borderRadius: '6px', border: 'none',
                    background: 'transparent', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryModal
        category={editingCategory}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchCategories() }}
      />
    </div>
  )
}