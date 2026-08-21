// app/api/bills/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateBillInput } from '@/lib/validation'
import { createNextRecurrence } from '@/lib/bill-recurrence'
import { isValidPaymentMethod } from '@/lib/payment-method-values'

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

    // Quick path: updating only the payment method tag (used by the
    // inline selector on the Bills list), without touching anything else.
    if ('paymentMethod' in body && Object.keys(body).length === 1) {
      if (body.paymentMethod !== null && !isValidPaymentMethod(body.paymentMethod)) {
        return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 })
      }

      const updated = await prisma.bill.update({
        where: { id },
        data: { paymentMethod: body.paymentMethod ?? null },
      })
      return NextResponse.json(updated)
    }

    if (body.receiptUrl === null && Object.keys(body).length <= 2) {
      const updated = await prisma.bill.update({
        where: { id },
        data: { receiptUrl: null, receiptName: null },
      })
      return NextResponse.json(updated)
    }

    const validation = validateBillInput({
      title: body.title ?? existing.title,
      amount: body.amount ?? existing.amount,
      dueDate: body.dueDate ?? existing.dueDate.toISOString().split('T')[0],
      categoryId: body.categoryId ?? existing.categoryId,
      isRecurring: body.isRecurring ?? existing.isRecurring,
      notes: body.notes ?? existing.notes,
      receiptUrl: body.receiptUrl !== undefined ? body.receiptUrl : existing.receiptUrl,
      receiptName: body.receiptName !== undefined ? body.receiptName : existing.receiptName,
      paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : existing.paymentMethod,
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { title, amount, dueDate, categoryId, isRecurring, notes, receiptUrl, receiptName, paymentMethod } = validation.data

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId: user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }

    const bill = await prisma.bill.update({
      where: { id },
      data: { title, amount, dueDate: new Date(dueDate), categoryId, isRecurring, notes, receiptUrl, receiptName, paymentMethod },
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