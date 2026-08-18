// components/bills/ReceiptViewButton.tsx
'use client'

import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'

export default function ReceiptViewButton({ billId }: { billId: string }) {
  const [loading, setLoading] = useState(false)

  const handleView = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/bills/${billId}/receipt-url`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load receipt')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open receipt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleView}
      disabled={loading}
      title="View receipt"
      aria-label="View receipt"
      style={{
        width: '30px', height: '30px', borderRadius: '6px', border: 'none',
        background: 'transparent', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
      }}
    >
      <Paperclip size={14} />
    </button>
  )
}