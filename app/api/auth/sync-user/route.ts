import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { id, email, name } = await req.json()

    // Check if user already exists by id (not email) to avoid id mismatch
    const existingUser = await prisma.user.findUnique({ where: { id } })

    if (!existingUser) {
      // Also check if there's a stale record with the same email but different id
      const staleUser = await prisma.user.findUnique({ where: { email } })
      if (staleUser) {
        // Delete stale user (cascades to their categories/bills/budgets)
        await prisma.user.delete({ where: { email } })
      }

      // Create fresh user with the correct Supabase id
      await prisma.user.create({
        data: { id, email, name },
      })

      // Seed default categories
      await prisma.category.createMany({
        data: [
          { name: 'Rent',        icon: '🏠', color: '#3B82F6', userId: id },
          { name: 'Electricity', icon: '⚡', color: '#F59E0B', userId: id },
          { name: 'Water',       icon: '💧', color: '#06B6D4', userId: id },
          { name: 'Internet',    icon: '📶', color: '#8B5CF6', userId: id },
          { name: 'School Fees', icon: '🎓', color: '#10B981', userId: id },
          { name: 'Groceries',   icon: '🛒', color: '#F97316', userId: id },
        ],
      })
    } else {
      // User exists, just update name if changed
      await prisma.user.update({
        where: { id },
        data: { name },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}