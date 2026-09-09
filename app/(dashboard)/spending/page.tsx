// app/(dashboard)/spending/page.tsx
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

  const budgetsByCategory = new Map<string, typeof budgets>()
  budgets.forEach(b => {
    const list = budgetsByCategory.get(b.categoryId) ?? []
    list.push(b)
    budgetsByCategory.set(b.categoryId, list)
  })

  const initialSummary = categories.map(cat => {
    const catBudgets = budgetsByCategory.get(cat.id) ?? []
    const catExpenses = expenses.filter(e => e.categoryId === cat.id)
    const envelopeIds = new Set(catBudgets.map(b => b.id))

    const envelopes = catBudgets.map(b => {
      const envExpenses = catExpenses.filter(e => e.budgetId === b.id)
      const spent = envExpenses.reduce((sum, e) => sum + e.amount, 0)
      return {
        id: b.id,
        name: b.name,
        amount: b.amount,
        spent,
        remaining: Math.max(b.amount - spent, 0),
        pctUsed: b.amount > 0 ? Math.min(Math.round((spent / b.amount) * 100), 999) : 0,
        entries: envExpenses.map(e => ({
          id: e.id,
          amount: e.amount,
          note: e.note,
          spentAt: e.spentAt.toISOString(),
        })),
      }
    })

    const unassignedExpenses = catExpenses.filter(e => !e.budgetId || !envelopeIds.has(e.budgetId))
    const unassignedSpent = unassignedExpenses.reduce((sum, e) => sum + e.amount, 0)

    const totalBudget = catBudgets.reduce((sum, b) => sum + b.amount, 0)
    const totalSpent = envelopes.reduce((sum, e) => sum + e.spent, 0) + unassignedSpent

    return {
      category: { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color },
      envelopes,
      unassigned: {
        spent: unassignedSpent,
        entries: unassignedExpenses.map(e => ({
          id: e.id,
          amount: e.amount,
          note: e.note,
          spentAt: e.spentAt.toISOString(),
        })),
      },
      totalBudget,
      totalSpent,
    }
  })

  return <SpendingPageClient initialSummary={initialSummary} initialMonth={month} initialYear={year} />
}