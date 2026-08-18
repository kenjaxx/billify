import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import BillsPageClient from './BillsPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BillsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bills = await prisma.bill.findMany({
    where: { userId: user.id },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
  })

  const initialBills = bills.map(b => ({
    id: b.id,
    title: b.title,
    amount: b.amount,
    dueDate: b.dueDate.toISOString(),
    status: b.status,
    categoryId: b.categoryId,
    isRecurring: b.isRecurring,
    notes: b.notes,
    receiptUrl: b.receiptUrl,
    category: { name: b.category.name, icon: b.category.icon, color: b.category.color },
  }))

  return <BillsPageClient initialBills={initialBills} />
}