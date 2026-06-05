import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { billReminderEmail } from '@/lib/bill-reminder-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    const startOfToday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ))
    const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

    const bills = await prisma.bill.findMany({
      where: {
        status: { in: ['UNPAID', 'OVERDUE'] },
        dueDate: { gte: startOfToday, lte: in7Days },
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
        from: 'Billify <onboarding@resend.dev>',
        to: user.email,
        subject: `⏰ Billify Reminder: ${userBills.length} bill${userBills.length > 1 ? 's' : ''} due in the next 7 days`,
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