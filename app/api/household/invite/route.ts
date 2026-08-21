import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { householdInviteEmail } from '@/lib/household-invite-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const household = await prisma.household.findFirst({ where: { ownerId: user.id } })
    if (!household) {
      return NextResponse.json({ error: 'Only the household owner can invite members.' }, { status: 403 })
    }

    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (email === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You can't invite yourself." }, { status: 400 })
    }

    const existingMember = await prisma.householdMember.findUnique({
      where: { householdId_email: { householdId: household.id, email } },
    })
    if (existingMember) {
      return NextResponse.json({
        error: existingMember.status === 'ACCEPTED'
          ? 'This person is already in your household.'
          : 'This person has already been invited.',
      }, { status: 400 })
    }

    const memberCount = await prisma.householdMember.count({ where: { householdId: household.id } })
    if (memberCount >= 8) {
      return NextResponse.json({ error: 'Households are limited to 8 members.' }, { status: 400 })
    }

    const member = await prisma.householdMember.create({
      data: { householdId: household.id, email, status: 'PENDING' },
    })

    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
      const { html, text } = householdInviteEmail({
        inviterName: dbUser?.name ?? user.email?.split('@')[0] ?? 'Someone',
        householdName: household.name,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://billify.app',
      })
      await resend.emails.send({
        from: 'Billify <onboarding@resend.dev>',
        to: email,
        subject: `You've been invited to join "${household.name}" on Billify`,
        html,
        text,
      })
    } catch (emailError) {
      console.error('Household invite email failed:', emailError)
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Household invite error:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}