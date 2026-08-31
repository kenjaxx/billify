import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const member = await prisma.householdMember.findUnique({
      where: { id },
      include: { household: true },
    })
    if (!member) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })

    if (member.household.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the household owner can cancel invites.' }, { status: 403 })
    }
    // Guard against canceling something that's no longer an outstanding
    // invite — once accepted it's a real member and should go through
    // the members DELETE route instead.
    if (member.status !== 'PENDING' || member.userId !== null) {
      return NextResponse.json({ error: 'This invite has already been accepted.' }, { status: 400 })
    }

    await prisma.householdMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Household invite cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 })
  }
}