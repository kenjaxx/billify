import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { isRateLimited } from '@/lib/rate-limit'
import { householdInviteEmail } from '@/lib/household-invite-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Shares the same quota/action as sending brand-new invites, so an
    // owner can't use "resend" as a side door around the invite limit.
    if (await isRateLimited(user.id, 5, 'household-invite')) {
      return NextResponse.json(
        { error: 'Too many invites sent. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    const { id } = await params
    const member = await prisma.householdMember.findUnique({
      where: { id },
      include: { household: true },
    })
    if (!member) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 })

    if (member.household.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the household owner can resend invites.' }, { status: 403 })
    }
    if (member.status !== 'PENDING' || member.userId !== null) {
      return NextResponse.json({ error: 'This invite is no longer pending.' }, { status: 400 })
    }

    const updated = await prisma.householdMember.update({
      where: { id },
      data: { invitedAt: new Date() },
    })

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      const { html, text } = householdInviteEmail({
        inviterName: dbUser?.name ?? user.email?.split('@')[0] ?? 'Someone',
        householdName: member.household.name,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://billify.app',
      })
      const { error: emailError } = await resend.emails.send({
        from: 'Billify <onboarding@resend.dev>',
        to: member.email,
        subject: `Reminder: You've been invited to join "${member.household.name}" on Billify`,
        html,
        text,
      })
      if (emailError) {
        console.error('Household invite resend email failed:', emailError)
        return NextResponse.json({ error: 'Invite refreshed, but the email failed to send.' }, { status: 502 })
      }
    } catch (emailError) {
      console.error('Household invite resend email failed:', emailError)
      return NextResponse.json({ error: 'Invite refreshed, but the email failed to send.' }, { status: 502 })
    }

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Household invite resend error:', error)
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 })
  }
}