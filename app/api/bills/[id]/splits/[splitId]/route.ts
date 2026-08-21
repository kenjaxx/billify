import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; splitId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, splitId } = await params
    const split = await prisma.billSplit.findUnique({
      where: { id: splitId },
      include: { bill: true, householdMember: true },
    })
    if (!split || split.billId !== id) {
      return NextResponse.json({ error: 'Split not found.' }, { status: 404 })
    }

    const isBillOwner = split.bill.userId === user.id
    const isDebtor = split.householdMember.userId === user.id
    if (!isBillOwner && !isDebtor) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }

    const body = await req.json()
    const isPaid = Boolean(body.isPaid)

    const updated = await prisma.billSplit.update({
      where: { id: splitId },
      data: { isPaid, paidAt: isPaid ? new Date() : null },
    })

    // Roll individual member payments up into the bill's own status: once
    // every household member's share is marked paid, the bill itself is
    // considered paid. If a share gets un-marked afterward (someone
    // reverses a mistaken tap), the bill goes back to unpaid rather than
    // silently staying "PAID" while money is still owed.
    const allSplits = await prisma.billSplit.findMany({ where: { billId: id } })
    const allPaid = allSplits.length > 0 && allSplits.every(s => s.isPaid)

    if (allPaid && split.bill.status !== 'PAID') {
      await prisma.bill.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() },
      })
    } else if (!allPaid && split.bill.status === 'PAID') {
      await prisma.bill.update({
        where: { id },
        data: { status: 'UNPAID', paidAt: null },
      })
    }

    return NextResponse.json({ split: updated })
  } catch (error) {
    console.error('Bill split PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update split' }, { status: 500 })
  }
}