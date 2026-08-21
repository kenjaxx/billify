// app/api/bills/[id]/receipt-url/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getUserHousehold } from '@/lib/get-household'
import { getReceiptSignedUrl, ReceiptNotFoundError } from '@/lib/supabase-storage-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const bill = await prisma.bill.findUnique({ where: { id } })
    if (!bill) {
      return NextResponse.json({ error: 'No receipt found' }, { status: 404 })
    }

    const isOwner = bill.userId === user.id
    let isHouseholdMate = false
    if (!isOwner && bill.householdId) {
      const household = await getUserHousehold(user.id)
      isHouseholdMate = !!household && household.id === bill.householdId
    }
    if (!isOwner && !isHouseholdMate) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (!bill.receiptUrl) {
      return NextResponse.json({ error: 'No receipt found' }, { status: 404 })
    }

    const signedUrl = await getReceiptSignedUrl(bill.receiptUrl)
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    if (error instanceof ReceiptNotFoundError) {
      console.error('Receipt URL error:', error.message)
      const { id } = await params
      await prisma.bill.update({
        where: { id },
        data: { receiptUrl: null, receiptName: null },
      }).catch(() => {})

      return NextResponse.json(
        { error: 'This receipt file no longer exists and has been unlinked from the bill.', code: 'receipt_missing' },
        { status: 404 }
      )
    }

    console.error('Receipt URL error:', error)
    return NextResponse.json({ error: 'Failed to get receipt' }, { status: 500 })
  }
}