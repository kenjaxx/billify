import { prisma } from '@/lib/prisma'

const WINDOW_MS = 60_000

/**
 * DB-backed rate limiter shared across all serverless instances.
 * Replaces the old in-memory Map, which reset per cold start and gave
 * every instance its own independent counter.
 *
 * `action` scopes the limit to a specific feature (e.g. 'ai',
 * 'household-invite') so spamming one doesn't burn the quota for the
 * other, and so different features can have different limits against
 * the same underlying log table.
 *
 * Each call prunes the caller's stale rows for that action, counts
 * what's left inside the trailing window, and — if under the limit —
 * records a new row.
 */
export async function isRateLimited(userId: string, limit: number, action: string = 'ai'): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MS)

  await prisma.aiRequestLog.deleteMany({
    where: { userId, action, createdAt: { lt: windowStart } },
  })

  const count = await prisma.aiRequestLog.count({
    where: { userId, action, createdAt: { gte: windowStart } },
  })

  if (count >= limit) return true

  await prisma.aiRequestLog.create({ data: { userId, action } })
  return false
}