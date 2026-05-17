'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
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
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bills</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage and track all your bills
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Bill
        </button>
      </div>

      {/* Bills List */}
      <BillList refresh={refresh} />

      {/* Add Bill Modal */}
      <AddBillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleBillAdded}
      />

    </div>
  )
}