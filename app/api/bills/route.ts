import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bills = await prisma.bill.findMany({
      where: { userId: user.id },
      include: { category: true },
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
    const bill = await prisma.bill.create({
      data: {
        title: body.title,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        isRecurring: body.isRecurring,
        notes: body.notes,
        status: 'UNPAID',
        userId: user.id,
        categoryId: body.categoryId,
      },
    })
    return NextResponse.json(bill)
  } catch (error) {
    console.error('Bills POST error:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}