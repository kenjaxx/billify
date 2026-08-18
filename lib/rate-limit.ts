import { prisma } from '@/lib/prisma'

const WINDOW_MS = 60_000

/**
 * DB-backed rate limiter shared across all serverless instances.
 * Replaces the old in-memory Map, which reset per cold start and gave
 * every instance its own independent counter — meaning the "5 requests
 * per minute" limit was really "5 requests per minute per instance",
 * easily bypassed under load.
 *
 * Each call prunes the caller's stale rows, counts what's left inside
 * the trailing window, and — if under the limit — records a new row.
 * Table stays small since old rows are deleted on every check.
 */
export async function isRateLimited(userId: string, limit: number): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MS)

  await prisma.aiRequestLog.deleteMany({
    where: { userId, createdAt: { lt: windowStart } },
  })

  const count = await prisma.aiRequestLog.count({
    where: { userId, createdAt: { gte: windowStart } },
  })

  if (count >= limit) return true

  await prisma.aiRequestLog.create({ data: { userId } })
  return false
}