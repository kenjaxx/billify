// app/api/expenses/[id]/route.ts — NEW FILE
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateExpenseInput } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 40, 'expenses-write')
    if (limited) return limited

    const { id } = await params
    const existing = await prisma.expense.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    const body = await req.json()
    const validation = validateExpenseInput({
      amount: body.amount ?? existing.amount,
      note: body.note !== undefined ? body.note : existing.note,
      categoryId: body.categoryId ?? existing.categoryId,
      spentAt: body.spentAt ?? existing.spentAt.toISOString(),
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { amount, note, categoryId, spentAt } = validation.data

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    })
    if (!category) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })

    const updated = await prisma.expense.update({
      where: { id },
      data: { amount, note, categoryId, spentAt: new Date(spentAt) },
      include: { category: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Expense PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limited = await checkRateLimit(user.id, 40, 'expenses-write')
    if (limited) return limited

    const { id } = await params
    const existing = await prisma.expense.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expense DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}