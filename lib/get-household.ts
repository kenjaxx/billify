import { prisma } from '@/lib/prisma'

/**
 * A user's household is either one they own, or one they're an accepted
 * member of. A user can only be tied to one household at a time in this
 * version — keeps the split UI unambiguous (no picking "which household").
 */
export async function getUserHousehold(userId: string) {
  const owned = await prisma.household.findFirst({
    where: { ownerId: userId },
    include: { members: { orderBy: { invitedAt: 'asc' } } },
  })
  if (owned) return owned

  const membership = await prisma.householdMember.findFirst({
    where: { userId, status: 'ACCEPTED' },
    include: {
      household: { include: { members: { orderBy: { invitedAt: 'asc' } } } },
    },
  })
  return membership?.household ?? null
}