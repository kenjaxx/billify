// lib/payment-method-values.ts
// Pure values — safe to import from both client and server code
// (no React/lucide dependency). Used by validation and Prisma-facing code.

export const PAYMENT_METHOD_VALUES = [
  'CASH',
  'GCASH',
  'MAYA',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
] as const

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number]

export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHOD_VALUES as readonly string[]).includes(value)
}