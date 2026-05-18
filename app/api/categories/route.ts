import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const category = await prisma.category.create({
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        userId: user.id,
      },
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}