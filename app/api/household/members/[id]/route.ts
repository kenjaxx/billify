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
    if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })

    const isOwner = member.household.ownerId === user.id
    const isSelf = member.userId === user.id

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }
    if (member.userId === member.household.ownerId) {
      return NextResponse.json({ error: "The owner can't be removed. Delete the household instead." }, { status: 400 })
    }

    await prisma.householdMember.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Household member DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}