'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BillList from './BillList'
import AddBillModal from './AddBillModal'

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  status: 'PAID' | 'UNPAID' | 'OVERDUE'
  categoryId: string
  isRecurring: boolean
  notes: string | null
  receiptUrl: string | null
  paymentMethod: string | null
  category: { name: string; icon: string | null; color: string | null }
  splits: {
    id: string
    amount: number
    isPaid: boolean
    householdMember: { id: string; userId: string | null; name: string | null; email: string }
  }[]
}

export default function BillsPageClient({ initialBills }: { initialBills: Bill[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setIsModalOpen(true)
      router.replace('/bills')
    }
  }, [searchParams, router])

  const handleBillAdded = () => {
    setRefresh(prev => prev + 1)
    setIsModalOpen(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '500', color: 'var(--text-primary)' }}>Bills</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Manage and track all your bills
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={15} />
          Add Bill
        </Button>
      </div>

      <BillList refresh={refresh} initialBills={initialBills} />

      <AddBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBillAdded}
      />
    </div>
  )
}