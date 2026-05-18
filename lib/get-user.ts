import { createSupabaseServer } from './supabase-server'

export async function getCurrentUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}