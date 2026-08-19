// lib/supabase-storage.ts
// Client-safe only — imported by 'use client' components like ReceiptUpload.
// Must never import supabase-admin here.
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

// Runs in the browser — the signed-in user's session satisfies the
// bucket's insert policy via RLS.
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