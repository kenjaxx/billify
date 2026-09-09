// app/api/expenses/route.ts — NEW FILE
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateExpenseInput } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const categoryId = searchParams.get('categoryId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = { userId: user.id }
    if (categoryId) where.categoryId = categoryId

    if (month && year) {
      const m = Number(month)
      const y = Number(year)
      if (Number.isInteger(m) && Number.isInteger(y)) {
        const start = new Date(y, m - 1, 1)
        const end = new Date(y, m, 0, 23, 59, 59, 999)
        where.spentAt = { gte: start, lte: end }
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { spentAt: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Expenses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 40, 'expenses-write')
    if (limited) return limited

    const body = await req.json()
    const validation = validateExpenseInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { amount, note, categoryId, spentAt } = validation.data

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        note,
        spentAt: new Date(spentAt),
        userId: user.id,
        categoryId,
      },
      include: { category: true },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Expenses POST error:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}