import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()

    // Last 6 months of bills
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const bills = await prisma.bill.findMany({
      where: {
        userId: 'temp-user-id',
        dueDate: { gte: sixMonthsAgo },
      },
      include: { category: true },
      orderBy: { dueDate: 'asc' },
    })

    // Group by month
    const monthlyData: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthlyData[key] = 0
    }

    bills.forEach(bill => {
      const d = new Date(bill.dueDate)
      const key = d.toLocaleString('default', { month: 'short', year: 'numeric' })
      if (monthlyData[key] !== undefined) {
        monthlyData[key] += bill.amount
      }
    })

    const monthly = Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total,
    }))

    // Group by category
    const categoryData: Record<string, { name: string; icon: string | null; total: number }> = {}
    bills.forEach(bill => {
      const cat = bill.category.name
      if (!categoryData[cat]) {
        categoryData[cat] = { name: cat, icon: bill.category.icon, total: 0 }
      }
      categoryData[cat].total += bill.amount
    })

    const byCategory = Object.values(categoryData).sort((a, b) => b.total - a.total)

    // Summary
    const totalSpent = bills.reduce((sum, b) => sum + b.amount, 0)
    const topCategory = byCategory[0] ?? null

    return NextResponse.json({ monthly, byCategory, totalSpent, topCategory })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}