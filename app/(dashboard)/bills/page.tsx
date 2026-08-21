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
    where: { userId: user.id, householdId: null },
    include: {
      category: true,
      splits: { include: { householdMember: true } },
    },
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
    paymentMethod: b.paymentMethod,
    category: { name: b.category.name, icon: b.category.icon, color: b.category.color },
    splits: b.splits.map(s => ({
      id: s.id,
      amount: s.amount,
      isPaid: s.isPaid,
      householdMember: {
        id: s.householdMember.id,
        userId: s.householdMember.userId,
        name: s.householdMember.name,
        email: s.householdMember.email,
      },
    })),
  }))

  return <BillsPageClient initialBills={initialBills} />
}