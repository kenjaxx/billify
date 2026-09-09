// lib/validation.ts
import { PAYMENT_METHOD_VALUES, isValidPaymentMethod, type PaymentMethod } from './payment-method-values'

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
  paymentMethod: PaymentMethod | null
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
  if (body.paymentMethod !== undefined && body.paymentMethod !== null && !isValidPaymentMethod(body.paymentMethod)) {
    return { valid: false, error: 'Invalid payment method.' }
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
      paymentMethod: body.paymentMethod && isValidPaymentMethod(body.paymentMethod) ? body.paymentMethod : null,
    },
  }
}

// lib/validation.ts — Budget input now supports an optional envelope name.
// When `name` is omitted (as the Bills-side Budgets page still does), it's
// stored as null and behaves exactly like before — one budget per category
// per month. Passing a name lets the same category have multiple budgets
// ("envelopes") that don't overwrite each other.
export type BudgetInput = { categoryId: string; amount: number; name: string | null }

export function validateBudgetInput(
  body: any
): { valid: true; data: BudgetInput } | { valid: false; error: string } {
  if (!isNonEmptyString(body.categoryId)) return { valid: false, error: 'Category is required.' }
  if (!isValidAmount(Number(body.amount))) return { valid: false, error: 'Amount must be a positive number.' }
  if (body.name !== undefined && body.name !== null && typeof body.name !== 'string') {
    return { valid: false, error: 'Budget name must be text.' }
  }
  if (body.name && String(body.name).trim().length > 60) {
    return { valid: false, error: 'Budget name is too long.' }
  }

  return {
    valid: true,
    data: {
      categoryId: body.categoryId,
      amount: Number(body.amount),
      name: body.name ? String(body.name).trim() : null,
    },
  }
}

// lib/validation.ts — update validateCategoryInput
export function validateCategoryInput(
  body: any
): { valid: true; data: { name: string; icon: string | null; color: string | null; type: 'BILL' | 'SPENDING' } } | { valid: false; error: string } {
  if (!isNonEmptyString(body.name)) return { valid: false, error: 'Category name is required.' }
  if (body.name.length > 50) return { valid: false, error: 'Category name is too long.' }

  const type = body.type === 'SPENDING' ? 'SPENDING' : 'BILL'

  return {
    valid: true,
    data: {
      name: body.name.trim(),
      icon: body.icon ? String(body.icon) : null,
      color: body.color ? String(body.color) : null,
      type,
    },
  }
}


// lib/validation.ts — expenses can now optionally reference a specific
// budget envelope (budgetId). If omitted, the expense is "unassigned"
// within its category — still tracked in the category total, just not
// counted against any one envelope's progress bar.
export type ExpenseInput = {
  amount: number
  note: string | null
  categoryId: string
  spentAt: string // ISO datetime
  budgetId: string | null
}

export function validateExpenseInput(
  body: any
): { valid: true; data: ExpenseInput } | { valid: false; error: string } {
  if (!isValidAmount(Number(body.amount))) return { valid: false, error: 'Amount must be a positive number.' }
  if (!isNonEmptyString(body.categoryId)) return { valid: false, error: 'Category is required.' }
  if (body.note !== undefined && body.note !== null && typeof body.note !== 'string') {
    return { valid: false, error: 'Note must be text.' }
  }
  if (body.note && body.note.length > 200) {
    return { valid: false, error: 'Note is too long.' }
  }
  if (body.budgetId !== undefined && body.budgetId !== null && typeof body.budgetId !== 'string') {
    return { valid: false, error: 'Invalid budget envelope.' }
  }

  let spentAt = new Date().toISOString()
  if (body.spentAt !== undefined && body.spentAt !== null) {
    const d = new Date(body.spentAt)
    if (isNaN(d.getTime())) return { valid: false, error: 'Invalid date/time.' }
    spentAt = d.toISOString()
  }

  return {
    valid: true,
    data: {
      amount: Number(body.amount),
      note: body.note ? String(body.note).trim() : null,
      categoryId: body.categoryId,
      spentAt,
      budgetId: body.budgetId ? String(body.budgetId) : null,
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

export { PAYMENT_METHOD_VALUES, isValidPaymentMethod }
export type { PaymentMethod }