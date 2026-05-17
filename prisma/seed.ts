import { PrismaClient } from '../app/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL! 
})

const prisma = new PrismaClient({ adapter })

async function main() {
  // Create temp user first
  await prisma.user.upsert({
    where: { email: 'temp@billify.com' },
    update: {},
    create: {
      id: 'temp-user-id',
      email: 'temp@billify.com',
      name: 'Kenji',
    },
  })
  console.log('✅ User created!')

  // Delete existing categories to avoid duplicates
  await prisma.category.deleteMany({ where: { userId: 'temp-user-id' } })

  // Seed categories
  await prisma.category.createMany({
    data: [
      { name: 'Rent', icon: '🏠', color: '#3B82F6', userId: 'temp-user-id' },
      { name: 'Electricity', icon: '⚡', color: '#F59E0B', userId: 'temp-user-id' },
      { name: 'Water', icon: '💧', color: '#06B6D4', userId: 'temp-user-id' },
      { name: 'Internet', icon: '📶', color: '#8B5CF6', userId: 'temp-user-id' },
      { name: 'School Fees', icon: '🎓', color: '#10B981', userId: 'temp-user-id' },
      { name: 'Groceries', icon: '🛒', color: '#F97316', userId: 'temp-user-id' },
    ],
  })
  console.log('✅ Categories seeded!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())