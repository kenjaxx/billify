// app/(dashboard)/spending/page.tsx — NEW FILE
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import SpendingPageClient from './SpendingPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SpendingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const [categories, budgets, expenses] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id, type: 'SPENDING' } }),
    prisma.budget.findMany({ where: { userId: user.id, month, year } }),
    prisma.expense.findMany({
      where: { userId: user.id, spentAt: { gte: start, lte: end } },
      orderBy: { spentAt: 'desc' },
    }),
  ])

  const budgetByCategory = new Map(budgets.map(b => [b.categoryId, b.amount]))

  const initialSummary = categories.map(cat => {
    const catExpenses = expenses.filter(e => e.categoryId === cat.id)
    const spent = catExpenses.reduce((sum, e) => sum + e.amount, 0)
    const budgetAmount = budgetByCategory.get(cat.id) ?? 0
    return {
      category: { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color },
      budget: budgetAmount,
      spent,
      remaining: Math.max(budgetAmount - spent, 0),
      pctUsed: budgetAmount > 0 ? Math.min(Math.round((spent / budgetAmount) * 100), 999) : 0,
      entries: catExpenses.map(e => ({
        id: e.id,
        amount: e.amount,
        note: e.note,
        spentAt: e.spentAt.toISOString(),
      })),
    }
  })

  return <SpendingPageClient initialSummary={initialSummary} initialMonth={month} initialYear={year} />
}