import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
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

    const body = await req.json()
    const now = new Date()

    const existing = await prisma.budget.findFirst({
      where: {
        userId: user.id,
        categoryId: body.categoryId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    })

    if (existing) {
      const updated = await prisma.budget.update({
        where: { id: existing.id },
        data: { amount: body.amount },
      })
      return NextResponse.json(updated)
    }

    const budget = await prisma.budget.create({
      data: {
        amount: body.amount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        userId: user.id,
        categoryId: body.categoryId,
      },
    })
    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}