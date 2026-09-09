// app/api/expenses/summary/route.ts — NEW FILE
// Gives per-category totals for a month, used to show "₱X of ₱8000 spent"
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { parseMonthYear } from '@/lib/monthly-budget'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const { month, year } = parseMonthYear(searchParams.get('month'), searchParams.get('year'))
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

    const summary = categories.map(cat => {
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

    return NextResponse.json({ month, year, summary })
  } catch (error) {
    console.error('Expenses summary GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}