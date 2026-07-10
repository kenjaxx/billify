export type BillStatus = 'PAID' | 'UNPAID' | 'OVERDUE'

/**
 * Returns the *effective* status of a bill for display purposes.
 * A bill stored as UNPAID but whose due date has passed is treated
 * as OVERDUE immediately in the UI, without waiting for the daily cron
 * to update the database record.
 */
export function getEffectiveStatus(bill: { status: BillStatus; dueDate: string | Date }): BillStatus {
  if (bill.status === 'PAID') return 'PAID'

  const due = new Date(bill.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  if (due < today) return 'OVERDUE'
  return bill.status
}