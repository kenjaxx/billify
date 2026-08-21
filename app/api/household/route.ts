import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'
import { getUserHousehold } from '@/lib/get-household'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const household = await getUserHousehold(user.id)
    if (!household) return NextResponse.json({ household: null })

    return NextResponse.json({
      household: {
        id: household.id,
        name: household.name,
        ownerId: household.ownerId,
        isOwner: household.ownerId === user.id,
        members: household.members,
      },
    })
  } catch (error) {
    console.error('Household GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch household' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await getUserHousehold(user.id)
    if (existing) {
      return NextResponse.json({ error: 'You are already part of a household.' }, { status: 400 })
    }

    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Household name is required.' }, { status: 400 })
    if (name.length > 60) return NextResponse.json({ error: 'Household name is too long.' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })

    const household = await prisma.household.create({
      data: {
        name,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            email: user.email!.toLowerCase(),
            name: dbUser?.name ?? null,
            status: 'ACCEPTED',
            joinedAt: new Date(),
          },
        },
      },
      include: { members: true },
    })

    return NextResponse.json({ household })
  } catch (error) {
    console.error('Household POST error:', error)
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 })
  }
}