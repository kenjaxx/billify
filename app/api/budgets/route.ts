import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const budgets = await prisma.budget.findMany({
      where: {
        userId: 'temp-user-id',
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
    const body = await req.json()
    const now = new Date()

    const existing = await prisma.budget.findFirst({
      where: {
        userId: 'temp-user-id',
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
        userId: 'temp-user-id',
        categoryId: body.categoryId,
      },
    })
    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budgets POST error:', error)
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 })
  }
}