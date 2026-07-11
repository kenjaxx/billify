import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateBillInput } from '@/lib/validation'
import { createNextRecurrence } from '@/lib/bill-recurrence'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const existing = await prisma.bill.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // ── Status-only update (mark paid / unpaid) ─────────────────────────
    if (body.status && Object.keys(body).length === 1) {
      const wasUnpaid = existing.status !== 'PAID'

      const updated = await prisma.bill.update({
        where: { id },
        data: {
          status: body.status,
          paidAt: body.status === 'PAID' ? new Date() : null,
        },
      })

      if (body.status === 'PAID' && wasUnpaid && existing.isRecurring) {
        await createNextRecurrence(existing)
      }

      return NextResponse.json(updated)
    }

    // ── Full edit (title, amount, category, due date, notes, recurring) ─
    const validation = validateBillInput({
      title: body.title ?? existing.title,
      amount: body.amount ?? existing.amount,
      dueDate: body.dueDate ?? existing.dueDate.toISOString().split('T')[0],
      categoryId: body.categoryId ?? existing.categoryId,
      isRecurring: body.isRecurring ?? existing.isRecurring,
      notes: body.notes ?? existing.notes,
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { title, amount, dueDate, categoryId, isRecurring, notes } = validation.data

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: { title, amount, dueDate: new Date(dueDate), categoryId, isRecurring, notes },
    })
    return NextResponse.json(bill)
  } catch (error) {
    console.error('Bill PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
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
    const existing = await prisma.bill.findFirst({ where: { id, userId: user.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    await prisma.bill.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bill DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}