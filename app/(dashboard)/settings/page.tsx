import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import SettingsPageClient from './SettingsPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

  const initialData = {
    id: user.id,
    email: user.email ?? '',
    name: dbUser?.name ?? null,
    reminderDays: dbUser?.reminderDays ?? 7,
    createdAt: dbUser?.createdAt ? dbUser.createdAt.toISOString() : null,
  }

  return <SettingsPageClient initialData={initialData} />
}