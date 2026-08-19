// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

// Service-role client — SERVER ONLY. Bypasses Row Level Security, so it
// must never be imported into a 'use client' component or otherwise
// reach the browser bundle. Used for privileged storage operations
// (like signing receipt URLs) where the caller has already been
// authenticated via getCurrentUser() in the API route itself.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)