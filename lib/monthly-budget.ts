import { prisma } from '@/lib/prisma'

/**
 * Total spend for a user in a given month: personal (non-household) bills
 * in full, plus ONLY the user's own split share of any household bills.
 *
 * Uses DB-side `aggregate` instead of `findMany` + JS `reduce` — for users
 * with a lot of bills/splits this avoids pulling every row into the Node
 * process just to sum one column.
 */
export async function getMonthlySpend(userId: string, month: number, year: number) {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)

  const [personalAgg, splitsAgg] = await Promise.all([
    prisma.bill.aggregate({
      where: { userId, householdId: null, dueDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.billSplit.aggregate({
      where: {
        householdMember: { userId },
        bill: { dueDate: { gte: start, lte: end } },
      },
      _sum: { amount: true },
    }),
  ])

  const personalTotal = personalAgg._sum.amount ?? 0
  const sharedTotal = splitsAgg._sum.amount ?? 0

  return { personalTotal, sharedTotal, total: personalTotal + sharedTotal }
}

/**
 * If the previous month had rollover enabled, carries its leftover
 * (budget + whatever it rolled in - what was spent) into this month.
 * Otherwise starts at 0. Only used when a MonthlyBudget row doesn't
 * exist yet for the target month.
 */
export async function computeRolledOverFrom(userId: string, month: number, year: number): Promise<number> {
  const prevDate = new Date(year, month - 2, 1)
  const prevMonth = prevDate.getMonth() + 1
  const prevYear = prevDate.getFullYear()

  const prevBudget = await prisma.monthlyBudget.findUnique({
    where: { userId_month_year: { userId, month: prevMonth, year: prevYear } },
  })
  if (!prevBudget || !prevBudget.rollover) return 0

  const prevSpend = await getMonthlySpend(userId, prevMonth, prevYear)
  const prevAvailable = prevBudget.amount + prevBudget.rolledOverFrom
  return Math.max(prevAvailable - prevSpend.total, 0)
}

export function parseMonthYear(monthRaw: unknown, yearRaw: unknown) {
  const now = new Date()
  const month = Number(monthRaw)
  const year = Number(yearRaw)
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : now.getFullYear()
  return { month: validMonth, year: validYear }
}