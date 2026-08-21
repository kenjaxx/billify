import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getUserHousehold } from '@/lib/get-household'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { splits: { include: { householdMember: true } } },
    })
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    const household = await getUserHousehold(user.id)
    const isOwner = bill.userId === user.id
    const isHouseholdMate = household && bill.householdId === household.id
    if (!isOwner && !isHouseholdMate) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json({ splits: bill.splits })
  } catch (error) {
    console.error('Bill splits GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch splits' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const bill = await prisma.bill.findFirst({ where: { id, userId: user.id } })
    if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

    const household = await getUserHousehold(user.id)
    if (!household) {
      return NextResponse.json({ error: 'You need a household before splitting bills.' }, { status: 400 })
    }

    const body = await req.json()
    const rawSplits: { householdMemberId: string; amount: number }[] = Array.isArray(body.splits) ? body.splits : []

    // Empty array = un-share this bill entirely.
    if (rawSplits.length === 0) {
      await prisma.$transaction(async tx => {
        await tx.billSplit.deleteMany({ where: { billId: id } })
        await tx.bill.update({ where: { id }, data: { householdId: null } })
      })
      return NextResponse.json({ splits: [] })
    }

    const validMemberIds = household.members.filter(m => m.status === 'ACCEPTED').map(m => m.id)
    for (const s of rawSplits) {
      if (!validMemberIds.includes(s.householdMemberId)) {
        return NextResponse.json({ error: 'Invalid household member in split.' }, { status: 400 })
      }
      if (typeof s.amount !== 'number' || !Number.isFinite(s.amount) || s.amount < 0) {
        return NextResponse.json({ error: 'Each split amount must be a non-negative number.' }, { status: 400 })
      }
    }

    const total = rawSplits.reduce((sum, s) => sum + s.amount, 0)
    // Small rounding tolerance (e.g. splitting ₱100 three ways).
    if (Math.abs(total - bill.amount) > 1) {
      return NextResponse.json({
        error: `Split amounts (₱${total.toLocaleString()}) must add up to the bill total (₱${bill.amount.toLocaleString()}).`,
      }, { status: 400 })
    }

    await prisma.$transaction(async tx => {
      await tx.billSplit.deleteMany({
        where: { billId: id, householdMemberId: { notIn: rawSplits.map(s => s.householdMemberId) } },
      })
      await tx.bill.update({ where: { id }, data: { householdId: household.id } })
      for (const s of rawSplits) {
        await tx.billSplit.upsert({
          where: { billId_householdMemberId: { billId: id, householdMemberId: s.householdMemberId } },
          update: { amount: s.amount },
          create: { billId: id, householdMemberId: s.householdMemberId, amount: s.amount },
        })
      }
    })

    const splits = await prisma.billSplit.findMany({
      where: { billId: id },
      include: { householdMember: true },
    })

    return NextResponse.json({ splits })
  } catch (error) {
    console.error('Bill splits POST error:', error)
    return NextResponse.json({ error: 'Failed to save splits' }, { status: 500 })
  }
}