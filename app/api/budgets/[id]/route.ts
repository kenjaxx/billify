import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { isValidAmount } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 20, 'budgets-write')
    if (limited) return limited

    const { id } = await params
    const existing = await prisma.budget.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })

    const body = await req.json()
    const data: { amount?: number; name?: string | null } = {}

    if (body.amount !== undefined) {
      const amount = Number(body.amount)
      if (!isValidAmount(amount)) {
        return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
      }
      data.amount = amount
    }

    if (body.name !== undefined) {
      if (body.name !== null && typeof body.name !== 'string') {
        return NextResponse.json({ error: 'Budget name must be text.' }, { status: 400 })
      }
      if (body.name && String(body.name).trim().length > 60) {
        return NextResponse.json({ error: 'Budget name is too long.' }, { status: 400 })
      }
      data.name = body.name ? String(body.name).trim() : null
    }

    const updated = await prisma.budget.update({ where: { id }, data, include: { category: true } })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Budget PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 20, 'budgets-write')
    if (limited) return limited

    const { id } = await params
    const existing = await prisma.budget.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })

    // Expense.budgetId has onDelete: SetNull, so expenses that were
    // logged under this envelope aren't deleted — they just fall back
    // to "unassigned" within the category.
    await prisma.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}