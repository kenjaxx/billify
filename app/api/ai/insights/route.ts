import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args)
}

// Same lightweight in-memory rate limiter pattern as /api/ai/parse-bill
const RATE_LIMIT = 5
const WINDOW_MS = 60_000
const requestLog = new Map<string, number[]>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const timestamps = (requestLog.get(userId) ?? []).filter(t => now - t < WINDOW_MS)
  timestamps.push(now)
  requestLog.set(userId, timestamps)
  return timestamps.length > RATE_LIMIT
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      )
    }

    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [thisMonthBills, historicalBills, budgets, upcoming] = await Promise.all([
      prisma.bill.findMany({
        where: { userId: user.id, dueDate: { gte: startOfThisMonth, lte: endOfThisMonth } },
        include: { category: true },
      }),
      prisma.bill.findMany({
        where: { userId: user.id, dueDate: { gte: sixMonthsAgo, lt: startOfThisMonth } },
        include: { category: true },
      }),
      prisma.budget.findMany({
        where: { userId: user.id, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { category: true },
      }),
      prisma.bill.findMany({
        where: { userId: user.id, status: { not: 'PAID' }, dueDate: { gte: now } },
        include: { category: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
    ])

    if (thisMonthBills.length === 0 && historicalBills.length === 0) {
      return NextResponse.json({ insights: [], generatedAt: now.toISOString() })
    }

    // Per-category historical monthly averages (up to 5 prior months)
    const historyByCategory: Record<string, { name: string; total: number; months: Set<string> }> = {}
    historicalBills.forEach(bill => {
      const key = bill.categoryId
      const monthKey = `${bill.dueDate.getFullYear()}-${bill.dueDate.getMonth()}`
      if (!historyByCategory[key]) {
        historyByCategory[key] = { name: bill.category.name, total: 0, months: new Set() }
      }
      historyByCategory[key].total += bill.amount
      historyByCategory[key].months.add(monthKey)
    })

    const thisMonthByCategory: Record<string, { name: string; total: number }> = {}
    thisMonthBills.forEach(bill => {
      const key = bill.categoryId
      if (!thisMonthByCategory[key]) thisMonthByCategory[key] = { name: bill.category.name, total: 0 }
      thisMonthByCategory[key].total += bill.amount
    })

    const categoryComparisons = Object.entries(thisMonthByCategory).map(([id, cur]) => {
      const hist = historyByCategory[id]
      const avg = hist && hist.months.size > 0 ? hist.total / hist.months.size : null
      return {
        category: cur.name,
        thisMonth: Math.round(cur.total),
        historicalAverage: avg !== null ? Math.round(avg) : null,
      }
    })

    const budgetStatus = budgets.map(b => {
      const spent = thisMonthByCategory[b.categoryId]?.total ?? 0
      return {
        category: b.category.name,
        budget: b.amount,
        spent: Math.round(spent),
        percentUsed: Math.round((spent / b.amount) * 100),
      }
    })

    const overdueCount = thisMonthBills.filter(b => b.status === 'OVERDUE').length
    const unpaidTotal = thisMonthBills
      .filter(b => b.status !== 'PAID')
      .reduce((sum, b) => sum + b.amount, 0)

    const summary = {
      currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      categoryComparisons,
      budgetStatus,
      overdueCount,
      unpaidTotal: Math.round(unpaidTotal),
      upcomingBills: upcoming.slice(0, 5).map(b => ({
        title: b.title,
        amount: b.amount,
        category: b.category.name,
        dueInDays: Math.ceil((b.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
    }

    const prompt = `
You are a personal finance assistant inside a bill-tracking app called Billify. Analyze the JSON data below and return 3-5 short, specific, actionable insights about the user's bills and spending.

Data:
${JSON.stringify(summary, null, 2)}

Rules:
- Return ONLY a valid JSON array, no markdown, no backticks, no explanation
- Each item: { "type": "warning" | "success" | "info", "message": string }
- "warning" for overspending, overdue bills, or budgets close to/over limit
- "success" for good habits (under budget, no overdue bills, spending down vs history)
- "info" for neutral observations or upcoming bill heads-up
- Keep each message under 20 words, specific with numbers (use ₱ for currency), no generic advice
- If there isn't enough data for a category, skip it rather than guessing
- Return an empty array if there is truly nothing noteworthy

Return this exact format:
[
  { "type": "warning", "message": "string" }
]
`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    devLog('Insights Gemini status:', geminiRes.status)

    if (!geminiRes.ok || geminiData.error) {
      console.error('Gemini API error:', geminiData.error)
      return NextResponse.json(
        { error: `Gemini error: ${geminiData.error?.message ?? 'Unknown error'}` },
        { status: 500 }
      )
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!raw) return NextResponse.json({ insights: [], generatedAt: now.toISOString() })

    const cleaned = raw.replace(/```json|```/g, '').trim()
    let insights: { type: string; message: string }[] = []
    try {
      insights = JSON.parse(cleaned)
      if (!Array.isArray(insights)) insights = []
    } catch {
      insights = []
    }

    const validTypes = new Set(['warning', 'success', 'info'])
    insights = insights
      .filter(i => i && typeof i.message === 'string' && validTypes.has(i.type))
      .slice(0, 5) as { type: string; message: string }[]

    return NextResponse.json({ insights, generatedAt: now.toISOString() })
  } catch (error) {
    console.error('Insights error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}