'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { toast } from 'sonner'
import CategoryModal from '@/components/categories/CategoryModal'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { IconActionButton } from '@/components/ui/icon-action-button'
import { EmptyState } from '@/components/ui/empty-state'
import { fetcher } from '@/lib/swr-fetcher'

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
  _count: { bills: number; budgets: number }
}

export default function CategoriesPageClient({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const { data: categories = [], isLoading: loading, mutate } = useSWR<Category[]>('/api/categories', fetcher, {
    fallbackData: initialCategories,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleAdd = () => { setEditingCategory(null); setModalOpen(true) }
  const handleEdit = (cat: Category) => { setEditingCategory(cat); setModalOpen(true) }
  const requestDelete = (cat: Category) => setPendingDelete(cat)

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setConfirmLoading(true)
    setDeletingId(pendingDelete.id)
    try {
      const res = await fetch(`/api/categories/${pendingDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`"${pendingDelete.name}" deleted.`)
      await mutate()
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Could not delete category.')
    } finally {
      setDeletingId(null)
      setConfirmLoading(false)
      setPendingDelete(null)
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
        <Button onClick={handleAdd}>
          <Plus size={15} />
          Add Category
        </Button>
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
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Categories let you organize bills and set per-category budgets."
            action={{ label: 'Add your first category', onClick: handleAdd }}
          />
        ) : (
          categories.map((cat, i) => (
            <div key={cat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', flexWrap: 'wrap', gap: '10px',
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
                <IconActionButton
                  icon={Pencil}
                  tone="default"
                  label={`Edit ${cat.name}`}
                  onClick={() => handleEdit(cat)}
                  disabled={deletingId === cat.id}
                />
                <IconActionButton
                  icon={Trash2}
                  tone="danger"
                  label={`Delete ${cat.name}`}
                  onClick={() => requestDelete(cat)}
                  disabled={deletingId === cat.id}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryModal
        category={editingCategory}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); toast.success(editingCategory ? 'Category updated.' : 'Category added.'); mutate(); router.refresh() }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this category?"
        description={
          pendingDelete
            ? (pendingDelete._count.bills > 0 || pendingDelete._count.budgets > 0
                ? `"${pendingDelete.name}" has ${pendingDelete._count.bills} bill(s) and ${pendingDelete._count.budgets} budget(s) attached. Deleting it will also delete all of them. This cannot be undone.`
                : `"${pendingDelete.name}" will be permanently deleted. This cannot be undone.`)
            : ''
        }
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}