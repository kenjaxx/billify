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
    const body = await req.json()
    const bill = await prisma.bill.update({
      where: { id, userId: user.id },
      data: {
        status: body.status,
        paidAt: body.status === 'PAID' ? new Date() : null,
      },
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
    await prisma.bill.delete({ where: { id, userId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bill DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}