import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getUserHousehold } from '@/lib/get-household'
import HouseholdPageClient from './HouseholdPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HouseholdPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const household = await getUserHousehold(user.id)

  const invites = user.email
    ? await prisma.householdMember.findMany({
        where: { email: user.email.toLowerCase(), status: 'PENDING', userId: null },
        include: { household: { include: { owner: { select: { name: true, email: true } } } } },
        orderBy: { invitedAt: 'desc' },
      })
    : []

  return (
    <HouseholdPageClient
      currentUserId={user.id}
      initialHousehold={
        household
          ? {
              id: household.id,
              name: household.name,
              ownerId: household.ownerId,
              isOwner: household.ownerId === user.id,
              members: household.members.map(m => ({
                id: m.id,
                email: m.email,
                name: m.name,
                status: m.status,
                userId: m.userId,
              })),
            }
          : null
      }
      initialInvites={invites.map(i => ({
        id: i.id,
        householdName: i.household.name,
        ownerName: i.household.owner.name ?? i.household.owner.email,
        invitedAt: i.invitedAt.toISOString(),
      }))}
    />
  )
}