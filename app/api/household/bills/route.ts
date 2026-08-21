import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getUserHousehold } from '@/lib/get-household'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const household = await getUserHousehold(user.id)
    if (!household) return NextResponse.json({ bills: [] })

    const bills = await prisma.bill.findMany({
      where: { householdId: household.id },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } },
        splits: { include: { householdMember: true } },
      },
      orderBy: { dueDate: 'desc' },
    })

    return NextResponse.json({ bills })
  } catch (error) {
    console.error('Household bills GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch shared bills' }, { status: 500 })
  }
}