import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { id, email, name } = await req.json()
    await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { id, email, name },
    })
    
    // Seed default categories for new user
    await prisma.category.createMany({
      data: [
        { name: 'Rent', icon: '🏠', color: '#3B82F6', userId: id },
        { name: 'Electricity', icon: '⚡', color: '#F59E0B', userId: id },
        { name: 'Water', icon: '💧', color: '#06B6D4', userId: id },
        { name: 'Internet', icon: '📶', color: '#8B5CF6', userId: id },
        { name: 'School Fees', icon: '🎓', color: '#10B981', userId: id },
        { name: 'Groceries', icon: '🛒', color: '#F97316', userId: id },
      ],
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}