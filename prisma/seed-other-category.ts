// prisma/seed-other-category.ts (run once via `npx tsx prisma/seed-other-category.ts`)
import { PrismaClient } from '@/app/generated/prisma'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  for (const user of users) {
    // Mark Groceries as SPENDING type
    await prisma.category.updateMany({
      where: { userId: user.id, name: 'Groceries' },
      data: { type: 'SPENDING' },
    })
    // Add "Other" spending category if missing
    const hasOther = await prisma.category.findFirst({
      where: { userId: user.id, name: 'Other' },
    })
    if (!hasOther) {
      await prisma.category.create({
        data: {
          name: 'Other',
          icon: '🧾',
          color: '#94a3b8',
          type: 'SPENDING',
          userId: user.id,
        },
      })
    }
  }
  console.log('Done.')
}

main().finally(() => prisma.$disconnect())