import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const body = await req.json()

    // Allocate leftover budget into the goal.
    if (typeof body.allocate === 'number') {
      if (!Number.isFinite(body.allocate) || body.allocate <= 0) {
        return NextResponse.json({ error: 'Allocation must be a positive number.' }, { status: 400 })
      }
      const updated = await prisma.savingsGoal.update({
        where: { id },
        data: { savedAmount: existing.savedAmount + body.allocate },
      })
      return NextResponse.json(updated)
    }

    // Edit name / target.
    const data: { name?: string; targetAmount?: number } = {}
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Goal name is required.' }, { status: 400 })
      }
      data.name = body.name.trim()
    }
    if (body.targetAmount !== undefined) {
      const targetAmount = Number(body.targetAmount)
      if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
        return NextResponse.json({ error: 'Target amount must be a positive number.' }, { status: 400 })
      }
      data.targetAmount = targetAmount
    }

    const updated = await prisma.savingsGoal.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Savings goal PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update savings goal' }, { status: 500 })
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
    const existing = await prisma.savingsGoal.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    await prisma.savingsGoal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Savings goal DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete savings goal' }, { status: 500 })
  }
}