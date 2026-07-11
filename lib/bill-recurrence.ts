import { prisma } from '@/lib/prisma'
import type { Bill } from '@/app/generated/prisma'

export async function createNextRecurrence(bill: Bill) {
  if (!bill.isRecurring) return

  const nextDueDate = new Date(bill.dueDate)
  nextDueDate.setMonth(nextDueDate.getMonth() + 1)

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