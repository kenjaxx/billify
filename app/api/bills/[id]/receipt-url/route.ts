// app/api/bills/[id]/receipt-url/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getReceiptSignedUrl } from '@/lib/supabase-storage'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const bill = await prisma.bill.findFirst({ where: { id, userId: user.id } })
    if (!bill || !bill.receiptUrl) {
      return NextResponse.json({ error: 'No receipt found' }, { status: 404 })
    }

    const signedUrl = await getReceiptSignedUrl(bill.receiptUrl)
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error('Receipt URL error:', error)
    return NextResponse.json({ error: 'Failed to get receipt' }, { status: 500 })
  }
}