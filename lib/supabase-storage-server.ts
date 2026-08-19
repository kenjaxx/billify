// lib/supabase-storage-server.ts
// SERVER ONLY. Never import this from a 'use client' component — it pulls
// in the service-role key, which must never reach the browser bundle.
import 'server-only'
import { supabaseAdmin } from './supabase-admin'

const BUCKET = 'receipts'

export class ReceiptNotFoundError extends Error {
  constructor(path: string) {
    super(`Receipt file not found in storage: ${path}`)
    this.name = 'ReceiptNotFoundError'
  }
}

export async function getReceiptSignedUrl(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 10)

  if (error) {
    if (error.message.toLowerCase().includes('not found')) {
      throw new ReceiptNotFoundError(path)
    }
    throw new Error(error.message)
  }

  return data.signedUrl
}

export async function deleteReceipt(path: string) {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}