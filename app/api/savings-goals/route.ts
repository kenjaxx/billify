import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { isValidAmount, isNonEmptyString } from '@/lib/validation'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(goals)
  } catch (error) {
    console.error('Savings goals GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!isNonEmptyString(body.name)) {
      return NextResponse.json({ error: 'Goal name is required.' }, { status: 400 })
    }
    if (body.name.length > 60) {
      return NextResponse.json({ error: 'Goal name is too long.' }, { status: 400 })
    }
    if (!isValidAmount(Number(body.targetAmount))) {
      return NextResponse.json({ error: 'Target amount must be a positive number.' }, { status: 400 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name: body.name.trim(),
        targetAmount: Number(body.targetAmount),
        userId: user.id,
      },
    })
    return NextResponse.json(goal)
  } catch (error) {
    console.error('Savings goals POST error:', error)
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 })
  }
}