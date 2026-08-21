import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { isValidAmount } from '@/lib/validation'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.budget.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })

    const body = await req.json()
    const amount = Number(body.amount)
    if (!isValidAmount(amount)) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
    }

    const updated = await prisma.budget.update({ where: { id }, data: { amount } })
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

    const { id } = await params
    const existing = await prisma.budget.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 })

    await prisma.budget.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Budget DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}