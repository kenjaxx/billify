// components/bills/ReceiptUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Paperclip, X, FileText, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { uploadReceipt, validateReceiptFile } from '@/lib/supabase-storage'
import { fileToBase64 } from '@/lib/file-to-base64'

type ParsedItem = {
  title: string | null
  amount: number | null
  dueDate: string | null
  categoryId: string | null
}

export default function ReceiptUpload({
  userId,
  billId,
  receiptUrl,
  receiptName,
  onChange,
  onParsed,
}: {
  userId: string
  billId: string
  receiptUrl: string | null
  receiptName: string | null
  onChange: (receiptUrl: string | null, receiptName: string | null) => void
  onParsed?: (items: ParsedItem[], receiptUrl: string, receiptName: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [reading, setReading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateReceiptFile(file)
    if (validationError) {
      toast.error(validationError)
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const { path, name } = await uploadReceipt(userId, billId, file)
      onChange(path, name)
      setUploading(false)

      if (onParsed) {
        setReading(true)
        try {
          const fileBase64 = await fileToBase64(file)
          const res = await fetch('/api/ai/parse-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64, mimeType: file.type }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Failed to read receipt')

          const items: ParsedItem[] = data.items ?? []
          if (items.length > 0) {
            onParsed(items, path, name)
          } else {
            toast.info('Receipt attached, but details could not be read. Please fill manually.')
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not read receipt details.')
        } finally {
          setReading(false)
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
      setUploading(false)
    } finally {
      e.target.value = ''
    }
  }

  // IMPORTANT: this only clears the reference on THIS bill. It intentionally
  // does NOT delete the file from storage — when a receipt was split into
  // several bills (AI multi-item parsing), every one of those bills points
  // at the same storage path. Deleting the object here would silently break
  // "View Receipt" on all the sibling bills too. If you ever need real
  // storage cleanup, it has to check no other Bill row still references the
  // same receiptUrl before calling deleteReceipt().
  const handleRemove = () => {
    onChange(null, null)
  }

  return (
    <div>
      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
        Receipt (optional) — upload to auto-fill the form
      </label>

      {receiptUrl ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-input)', border: '0.5px solid var(--border-input)',
          borderRadius: '8px', padding: '10px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {reading ? <Loader2 size={14} color="#a78bfa" className="animate-spin" /> : <FileText size={14} color="var(--text-secondary)" />}
            <span style={{
              fontSize: '12px', color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {reading ? 'Reading receipt...' : (receiptName ?? 'Receipt attached')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={reading}
            aria-label="Remove receipt from this bill"
            title="Remove from this bill (the file itself is kept, in case other bills from the same receipt still use it)"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: reading ? 'not-allowed' : 'pointer', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px dashed var(--border-strong)', background: 'transparent',
            fontSize: '12px', color: 'var(--text-muted)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
            : <><Sparkles size={14} /> Upload photo or PDF — AI fills the form</>
          }
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}