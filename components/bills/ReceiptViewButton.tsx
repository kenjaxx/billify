// components/bills/ReceiptViewButton.tsx
'use client'

import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { IconActionButton } from '@/components/ui/icon-action-button'

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
    <IconActionButton
      icon={Paperclip}
      tone="info"
      label="View receipt"
      onClick={handleView}
      disabled={loading}
    />
  )
}