// lib/timing-safe.ts
import crypto from 'crypto'

/**
 * Constant-time string comparison — protects secret comparisons (API
 * keys, cron/webhook tokens) from timing attacks where an attacker
 * measures response time to guess the secret byte-by-byte. A plain
 * `===` comparison short-circuits on the first mismatched character,
 * which leaks timing information; `crypto.timingSafeEqual` doesn't.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    // crypto.timingSafeEqual throws on mismatched lengths. Do a
    // dummy same-length comparison first so the total time spent
    // doesn't obviously vary based on the length mismatch itself.
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }

  return crypto.timingSafeEqual(bufA, bufB)
}