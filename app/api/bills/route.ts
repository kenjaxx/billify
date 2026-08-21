// app/api/bills/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateBillInput } from '@/lib/validation'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Bills that have been shared with a household live exclusively in the
    // Shared Bills section (see /api/household/bills) so they don't get
    // mixed in with the user's personal bill list here.
    const bills = await prisma.bill.findMany({
      where: { userId: user.id, householdId: null },
      include: {
        category: true,
        splits: { include: { householdMember: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
    return NextResponse.json(bills)
  } catch (error) {
    console.error('Bills API error:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const validation = validateBillInput(body)
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

    const bill = await prisma.bill.create({
      data: {
        title,
        amount,
        dueDate: new Date(dueDate),
        isRecurring,
        notes,
        receiptUrl,
        receiptName,
        paymentMethod,
        status: 'UNPAID',
        userId: user.id,
        categoryId,
      },
    })
    return NextResponse.json(bill)
  } catch (error) {
    console.error('Bills POST error:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}