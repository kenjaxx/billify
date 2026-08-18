import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import BudgetsPageClient from './BudgetsPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BudgetsPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [budgets, bills] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id, month, year },
      include: { category: true },
    }),
    prisma.bill.findMany({
      where: { userId: user.id },
      select: { amount: true, status: true, categoryId: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const initialBudgets = budgets.map(b => ({
    id: b.id,
    amount: b.amount,
    category: { id: b.category.id, name: b.category.name, icon: b.category.icon, color: b.category.color },
  }))

  const initialBills = bills.map(b => ({
    amount: b.amount,
    status: b.status,
    categoryId: b.categoryId,
    dueDate: b.dueDate.toISOString(),
  }))

  return (
    <BudgetsPageClient
      initialBudgets={initialBudgets}
      initialBills={initialBills}
      initialMonth={month}
      initialYear={year}
    />
  )
}