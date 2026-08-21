import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getUserHousehold } from '@/lib/get-household'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const action = body.action

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 })
    }

    const invite = await prisma.householdMember.findUnique({ where: { id } })
    if (!invite || invite.status !== 'PENDING' || invite.userId !== null) {
      return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'This invite is not addressed to you.' }, { status: 403 })
    }

    if (action === 'decline') {
      await prisma.householdMember.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    const currentHousehold = await getUserHousehold(user.id)
    if (currentHousehold) {
      return NextResponse.json({
        error: 'You are already part of a household. Leave it before accepting a new invite.',
      }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

    const updated = await prisma.householdMember.update({
      where: { id },
      data: { userId: user.id, name: dbUser?.name ?? null, status: 'ACCEPTED', joinedAt: new Date() },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Household invite action error:', error)
    return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
  }
}