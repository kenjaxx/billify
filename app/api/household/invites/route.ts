import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invites = await prisma.householdMember.findMany({
      where: { email: user.email.toLowerCase(), status: 'PENDING', userId: null },
      include: { household: { include: { owner: { select: { name: true, email: true } } } } },
      orderBy: { invitedAt: 'desc' },
    })

    return NextResponse.json({
      invites: invites.map(i => ({
        id: i.id,
        householdName: i.household.name,
        ownerName: i.household.owner.name ?? i.household.owner.email,
        invitedAt: i.invitedAt,
      })),
    })
  } catch (error) {
    console.error('Household invites GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}