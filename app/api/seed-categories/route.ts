import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Create the user record first if it doesn't exist
    await prisma.user.upsert({
      where: { email: user.email! },
      update: {},
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name ?? null,
      },
    })

    await prisma.category.createMany({
      data: [
        { name: 'Rent', icon: '🏠', color: '#3B82F6', userId: user.id },
        { name: 'Electricity', icon: '⚡', color: '#F59E0B', userId: user.id },
        { name: 'Water', icon: '💧', color: '#06B6D4', userId: user.id },
        { name: 'Internet', icon: '📶', color: '#8B5CF6', userId: user.id },
        { name: 'School Fees', icon: '🎓', color: '#10B981', userId: user.id },
        { name: 'Groceries', icon: '🛒', color: '#F97316', userId: user.id },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}