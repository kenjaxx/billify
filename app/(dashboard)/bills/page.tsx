'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import BillList from '../bills/BillList'
import AddBillModal from '../bills/AddBillModal'

export default function BillsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const handleBillAdded = () => {
    setRefresh(prev => prev + 1)
    setIsModalOpen(false)
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
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#3b82f6', color: '#fff', border: 'none',
            padding: '9px 16px', borderRadius: '8px',
            fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Add Bill
        </button>
      </div>

      <BillList refresh={refresh} />

      <AddBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBillAdded}
      />
    </div>
  )
}