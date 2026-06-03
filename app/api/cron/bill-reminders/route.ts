import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { billReminderEmail } from '@/lib/bill-reminder-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron (or you, for testing)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Find all unpaid bills due within the next 7 days, grouped by user
    const bills = await prisma.bill.findMany({
      where: {
        status: { in: ['UNPAID', 'OVERDUE'] },
        dueDate: { gte: now, lte: in7Days },
      },
      include: {
        category: true,
        user: true,
      },
      orderBy: { dueDate: 'asc' },
    })

    if (bills.length === 0) {
      return NextResponse.json({ message: 'No upcoming bills to notify about.' })
    }

    // Group bills by user
    const byUser = bills.reduce<Record<string, typeof bills>>((acc, bill) => {
      const uid = bill.userId
      if (!acc[uid]) acc[uid] = []
      acc[uid].push(bill)
      return acc
    }, {})

    const results: { email: string; billCount: number; status: string }[] = []

    for (const [, userBills] of Object.entries(byUser)) {
      const user = userBills[0].user
      if (!user.email) continue

      const { html, text } = billReminderEmail({
        userName: user.name ?? user.email.split('@')[0],
        bills: userBills.map(b => ({
          title: b.title,
          amount: b.amount,
          dueDate: b.dueDate,
          categoryName: b.category.name,
          categoryIcon: b.category.icon ?? '📄',
        })),
      })

      const { error } = await resend.emails.send({
        from: 'Billify <onboarding@resend.dev>', // ← change to your verified domain
        to: user.email,
        subject: `⏰ Billify Reminder: ${userBills.length} bill${userBills.length > 1 ? 's' : ''} due this week`,
        html,
        text,
      })

      results.push({
        email: user.email,
        billCount: userBills.length,
        status: error ? `failed: ${error.message}` : 'sent',
      })
    }

    return NextResponse.json({ notified: results.length, results })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}