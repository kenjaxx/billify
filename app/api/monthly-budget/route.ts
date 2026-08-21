import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { isValidAmount } from '@/lib/validation'
import { getMonthlySpend, computeRolledOverFrom, parseMonthYear } from '@/lib/monthly-budget'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const { month, year } = parseMonthYear(searchParams.get('month'), searchParams.get('year'))

    const [budget, spend] = await Promise.all([
      prisma.monthlyBudget.findUnique({ where: { userId_month_year: { userId: user.id, month, year } } }),
      getMonthlySpend(user.id, month, year),
    ])

    const rolledOverFrom = budget?.rolledOverFrom ?? (await computeRolledOverFrom(user.id, month, year))
    const amount = budget?.amount ?? 0
    const totalAvailable = amount + rolledOverFrom
    const remaining = totalAvailable - spend.total

    return NextResponse.json({
      isSet: !!budget,
      amount,
      rollover: budget?.rollover ?? false,
      rolledOverFrom,
      personalSpent: spend.personalTotal,
      sharedSpent: spend.sharedTotal,
      spent: spend.total,
      totalAvailable,
      remaining,
      month,
      year,
    })
  } catch (error) {
    console.error('Monthly budget GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch monthly budget' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { month, year } = parseMonthYear(body.month, body.year)
    const amount = Number(body.amount)
    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: 'Budget amount must be a positive number.' }, { status: 400 })
    }
    const rollover = Boolean(body.rollover)

    const existing = await prisma.monthlyBudget.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } },
    })

    // Only compute a fresh rollover amount the first time this month's
    // budget is created — editing the amount/rollover flag later shouldn't
    // silently recalculate what already carried in.
    const rolledOverFrom = existing
      ? existing.rolledOverFrom
      : await computeRolledOverFrom(user.id, month, year)

    const budget = await prisma.monthlyBudget.upsert({
      where: { userId_month_year: { userId: user.id, month, year } },
      update: { amount, rollover },
      create: { userId: user.id, month, year, amount, rollover, rolledOverFrom },
    })

    const spend = await getMonthlySpend(user.id, month, year)
    const totalAvailable = budget.amount + budget.rolledOverFrom
    const remaining = totalAvailable - spend.total

    return NextResponse.json({
      isSet: true,
      amount: budget.amount,
      rollover: budget.rollover,
      rolledOverFrom: budget.rolledOverFrom,
      personalSpent: spend.personalTotal,
      sharedSpent: spend.sharedTotal,
      spent: spend.total,
      totalAvailable,
      remaining,
      month,
      year,
    })
  } catch (error) {
    console.error('Monthly budget POST error:', error)
    return NextResponse.json({ error: 'Failed to save monthly budget' }, { status: 500 })
  }
}