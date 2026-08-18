// lib/supabase-storage.ts
import { supabase } from './supabase'

const BUCKET = 'receipts'
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WEBP, or PDF files are allowed.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'File must be under 10MB.'
  }
  return null
}

export async function uploadReceipt(userId: string, billId: string, file: File) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${billId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  return { path, name: file.name }
}

export async function getReceiptSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function deleteReceipt(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}