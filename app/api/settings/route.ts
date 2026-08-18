// app/api/settings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { validateReminderDays } from '@/lib/validation'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: dbUser?.name ?? null,
      reminderDays: dbUser?.reminderDays ?? 7,
      createdAt: dbUser?.createdAt ?? null,
    })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const data: { name?: string; reminderDays?: number } = {}

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
      if (name.length > 100) return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
      data.name = name
    }

    if (body.reminderDays !== undefined) {
      const validation = validateReminderDays(body.reminderDays)
      if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })
      data.reminderDays = validation.days
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data })

    return NextResponse.json({ id: updated.id, email: updated.email, name: updated.name, reminderDays: updated.reminderDays })
  } catch (error) {
    console.error('Settings PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}