// lib/validation.ts
export function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isFinite(amount) && amount > 0
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  const d = new Date(value)
  return !isNaN(d.getTime())
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export type BillInput = {
  title: string
  amount: number
  dueDate: string
  categoryId: string
  isRecurring: boolean
  notes: string | null
  receiptUrl: string | null
  receiptName: string | null
}

export function validateBillInput(
  body: any
): { valid: true; data: BillInput } | { valid: false; error: string } {
  if (!isNonEmptyString(body.title)) return { valid: false, error: 'Title is required.' }
  if (body.title.length > 200) return { valid: false, error: 'Title is too long.' }
  if (!isValidAmount(Number(body.amount))) return { valid: false, error: 'Amount must be a positive number.' }
  if (!isValidDateString(body.dueDate)) return { valid: false, error: 'A valid due date is required.' }
  if (!isNonEmptyString(body.categoryId)) return { valid: false, error: 'Category is required.' }
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    return { valid: false, error: 'Notes must be text.' }
  }
  if (body.receiptUrl !== undefined && body.receiptUrl !== null && typeof body.receiptUrl !== 'string') {
    return { valid: false, error: 'Invalid receipt.' }
  }

  return {
    valid: true,
    data: {
      title: body.title.trim(),
      amount: Number(body.amount),
      dueDate: body.dueDate,
      categoryId: body.categoryId,
      isRecurring: Boolean(body.isRecurring),
      notes: body.notes ? String(body.notes).trim() : null,
      receiptUrl: body.receiptUrl ? String(body.receiptUrl) : null,
      receiptName: body.receiptName ? String(body.receiptName) : null,
    },
  }
}

export function validateBudgetInput(
  body: any
): { valid: true; data: { categoryId: string; amount: number } } | { valid: false; error: string } {
  if (!isNonEmptyString(body.categoryId)) return { valid: false, error: 'Category is required.' }
  if (!isValidAmount(Number(body.amount))) return { valid: false, error: 'Amount must be a positive number.' }

  return { valid: true, data: { categoryId: body.categoryId, amount: Number(body.amount) } }
}

export function validateCategoryInput(
  body: any
): { valid: true; data: { name: string; icon: string | null; color: string | null } } | { valid: false; error: string } {
  if (!isNonEmptyString(body.name)) return { valid: false, error: 'Category name is required.' }
  if (body.name.length > 50) return { valid: false, error: 'Category name is too long.' }

  return {
    valid: true,
    data: {
      name: body.name.trim(),
      icon: body.icon ? String(body.icon) : null,
      color: body.color ? String(body.color) : null,
    },
  }
}

export function validateReminderDays(value: unknown): { valid: true; days: number } | { valid: false; error: string } {
  const days = Number(value)
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    return { valid: false, error: 'Reminder days must be between 1 and 30.' }
  }
  return { valid: true, days }
}