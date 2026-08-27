import { prisma } from '@/lib/prisma'
import type { Bill } from '@/app/generated/prisma'

function nextDueDateFor(bill: Bill) {
  const next = new Date(bill.dueDate)
  next.setMonth(next.getMonth() + 1)
  return next
}

export async function createNextRecurrence(bill: Bill) {
  if (!bill.isRecurring) return

  const nextDueDate = nextDueDateFor(bill)

  const alreadyExists = await prisma.bill.findFirst({
    where: {
      userId: bill.userId,
      title: bill.title,
      categoryId: bill.categoryId,
      dueDate: nextDueDate,
    },
  })

  if (!alreadyExists) {
    await prisma.bill.create({
      data: {
        title: bill.title,
        amount: bill.amount,
        dueDate: nextDueDate,
        isRecurring: true,
        notes: bill.notes,
        status: 'UNPAID',
        userId: bill.userId,
        categoryId: bill.categoryId,
      },
    })
  }
}

/**
 * Batch version used by bulk "mark paid". Instead of one findFirst + one
 * create per recurring bill (N+1), this does:
 *   1. one findMany covering every candidate's (userId, title, categoryId,
 *      dueDate) combo via a single OR query
 *   2. one createMany for whatever isn't already present
 */
export async function createNextRecurrences(bills: Bill[]) {
  const recurring = bills.filter(b => b.isRecurring)
  if (recurring.length === 0) return

  const candidates = recurring.map(bill => ({ bill, nextDueDate: nextDueDateFor(bill) }))

  const existing = await prisma.bill.findMany({
    where: {
      OR: candidates.map(({ bill, nextDueDate }) => ({
        userId: bill.userId,
        title: bill.title,
        categoryId: bill.categoryId,
        dueDate: nextDueDate,
      })),
    },
    select: { userId: true, title: true, categoryId: true, dueDate: true },
  })

  const keyOf = (u: string, t: string, c: string, d: Date) => `${u}|${t}|${c}|${d.getTime()}`
  const existingKeys = new Set(existing.map(e => keyOf(e.userId, e.title, e.categoryId, e.dueDate)))

  const toCreate = candidates
    .filter(({ bill, nextDueDate }) => !existingKeys.has(keyOf(bill.userId, bill.title, bill.categoryId, nextDueDate)))
    .map(({ bill, nextDueDate }) => ({
      title: bill.title,
      amount: bill.amount,
      dueDate: nextDueDate,
      isRecurring: true,
      notes: bill.notes,
      status: 'UNPAID' as const,
      userId: bill.userId,
      categoryId: bill.categoryId,
    }))

  if (toCreate.length > 0) {
    await prisma.bill.createMany({ data: toCreate })
  }
}