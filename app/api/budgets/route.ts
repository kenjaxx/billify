import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateBudgetInput } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

function parseMonthYear(monthRaw: unknown, yearRaw: unknown) {
  const now = new Date()
  const month = Number(monthRaw)
  const year = Number(yearRaw)
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear()
  return { month: validMonth, year: validYear }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const { month, year } = parseMonthYear(searchParams.get('month'), searchParams.get('year'))

    // Only return budgets tied to BILL categories here. Spending-goal
    // budgets (SPENDING category, created from the Goals section on the
    // Budgets page) are fetched separately via /api/expenses/summary.
    // Without this filter, a spending goal showed up a SECOND time here
    // as a stray "budget" card whose spend is computed from Bills
    // (always ₱0) instead of Expenses — which is why it looked like it
    // was reset to 0/8000 even though money had been logged against it.
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month, year, category: { type: 'BILL' } },
      include: { category: true },
    })
    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Budgets GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 20, 'budgets-write')
    if (limited) return limited

    const body = await req.json()
    const validation = validateBudgetInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { categoryId, amount, name } = validation.data
    const { month, year } = parseMonthYear(body.month, body.year)

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }

    const existing = await prisma.budget.findFirst({
      where: { userId: user.id, categoryId, month, year, name: name ?? null },
    })

    if (existing) {
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount },
        include: { category: true },
      })
      return NextResponse.json(updated)
    }

    const budget = await prisma.budget.create({
      data: { amount, name, month, year, userId: user.id, categoryId },
      include: { category: true },
    })
    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}