import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.OWNER_USERNAME?.trim().toLowerCase()
  const password = process.env.OWNER_PASSWORD
  const name = process.env.OWNER_NAME?.trim() || 'Owner'

  if (!username || !password) {
    throw new Error('OWNER_USERNAME and OWNER_PASSWORD are required')
  }
  if (password.length < 8) throw new Error('OWNER_PASSWORD must contain at least 8 characters')

  await prisma.user.upsert({
    where: { username },
    update: { name, passwordHash: await hash(password, 12), role: 'owner', isActive: true },
    create: { username, name, passwordHash: await hash(password, 12), role: 'owner' },
  })
  console.log(`Owner account ${username} is ready`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
