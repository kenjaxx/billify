import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { createNextRecurrences } from '@/lib/bill-recurrence'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Lower limit than single-bill writes since one call here can affect
    // many rows at once.
    const limited = await checkRateLimit(user.id, 10, 'bills-bulk')
    if (limited) return limited

    const body = await req.json()
    const ids: string[] = Array.isArray(body.ids) ? body.ids : []
    const action = body.action

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No bills selected.' }, { status: 400 })
    }
    if (!['markPaid', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    const bills = await prisma.bill.findMany({
      where: { id: { in: ids }, userId: user.id },
    })

    if (bills.length === 0) {
      return NextResponse.json({ error: 'No matching bills found.' }, { status: 404 })
    }

    const validIds = bills.map(b => b.id)

    if (action === 'delete') {
      await prisma.bill.deleteMany({ where: { id: { in: validIds }, userId: user.id } })
      return NextResponse.json({ success: true, affected: validIds.length })
    }

    const billsToMark = bills.filter(b => b.status !== 'PAID')

    await prisma.bill.updateMany({
      where: { id: { in: billsToMark.map(b => b.id) }, userId: user.id },
      data: { status: 'PAID', paidAt: new Date() },
    })

    // One batched check + createMany instead of N sequential round-trips.
    await createNextRecurrences(billsToMark)

    return NextResponse.json({ success: true, affected: billsToMark.length })
  } catch (error) {
    console.error('Bulk bills error:', error)
    return NextResponse.json({ error: 'Failed to update bills' }, { status: 500 })
  }
}