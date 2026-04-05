import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function globalTeardown(): Promise<void> {
  // Delete experiences before users (FK constraint: experiences_createdById_fkey / updatedById_fkey)
  const testExps = await prisma.experience.findMany({
    where: {
      OR: [
        { companyName: { startsWith: 'e2e-' } },
        { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
        { updatedBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
      ],
    },
    select: { id: true },
  });
  if (testExps.length) {
    const ids = testExps.map((e) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }

  // Delete profiles before users (FK constraint: profiles_userId_fkey)
  await prisma.profile.deleteMany({
    where: { user: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
  });

  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-', endsWith: '@e2e.local' } },
  });

  await prisma.$disconnect();
}

export default globalTeardown;
