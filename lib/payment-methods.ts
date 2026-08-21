// lib/payment-methods.ts
// UI metadata (labels, colors, icons) for payment methods. Client-facing
// concerns live here — keep payment-method-values.ts free of React/lucide
// imports since that file is also used by server-side validation code.
import { Wallet, Smartphone, CreditCard, Landmark, HelpCircle, LucideIcon } from 'lucide-react'
import { PaymentMethod } from './payment-method-values'

export type { PaymentMethod }

export type PaymentMethodMeta = {
  value: PaymentMethod
  label: string
  icon: LucideIcon
  color: string
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { value: 'CASH',          label: 'Cash',          icon: Wallet,     color: '#34d399' },
  { value: 'GCASH',         label: 'GCash',         icon: Smartphone, color: '#3b82f6' },
  { value: 'MAYA',          label: 'Maya',          icon: Smartphone, color: '#22c55e' },
  { value: 'CREDIT_CARD',   label: 'Credit Card',   icon: CreditCard, color: '#a78bfa' },
  { value: 'DEBIT_CARD',    label: 'Debit Card',    icon: CreditCard, color: '#60a5fa' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Landmark,   color: '#fbbf24' },
  { value: 'OTHER',         label: 'Other',         icon: HelpCircle, color: '#94a3b8' },
]

export function getPaymentMethodMeta(value: string | null | undefined): PaymentMethodMeta | null {
  if (!value) return null
  return PAYMENT_METHODS.find(m => m.value === value) ?? null
}