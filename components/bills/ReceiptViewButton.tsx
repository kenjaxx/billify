// components/bills/ReceiptViewButton.tsx
'use client'

import { useState } from 'react'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { IconActionButton } from '@/components/ui/icon-action-button'

type ReceiptUrlError = Error & { code?: string }

export default function ReceiptViewButton({ billId }: { billId: string }) {
  const [loading, setLoading] = useState(false)

  const fetchSignedUrl = async (): Promise<string> => {
    const res = await fetch(`/api/bills/${billId}/receipt-url`)
    const data = await res.json()
    if (!res.ok) {
      const err = new Error(data.error ?? 'Failed to load receipt') as ReceiptUrlError
      err.code = data.code
      throw err
    }
    return data.url as string
  }

  const handleView = async () => {
    setLoading(true)
    try {
      let url: string
      try {
        url = await fetchSignedUrl()
      } catch (err) {
        const code = (err as ReceiptUrlError)?.code
        // Permanent failure — the file is actually gone. Retrying
        // won't help, so surface the error immediately.
        if (code === 'receipt_missing') throw err
        // Otherwise assume it was transient (network blip, momentary
        // signing error) and retry once before giving up.
        url = await fetchSignedUrl()
      }
      window.open(url, '_blank', 'noopener,noreferrer')
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