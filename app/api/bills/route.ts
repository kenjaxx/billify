import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
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
    const body = await req.json()
    const bill = await prisma.bill.create({
      data: {
        title: body.title,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        isRecurring: body.isRecurring,
        notes: body.notes,
        status: 'UNPAID',
        userId: 'temp-user-id',
        categoryId: body.categoryId,
      },
    })
    return NextResponse.json(bill)
  } catch (error) {
    console.error('Bills POST error:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}