import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

async function globalTeardown(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  // Clean up test experiences
  const testExps = await prisma.experience.findMany({
    where: { companyName: { startsWith: 'e2e-landing-exp-' } },
    select: { id: true },
  });
  if (testExps.length) {
    const ids = testExps.map((e) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }

  // Clean up test profiles
  await prisma.profile.deleteMany({
    where: { user: { email: 'test-admin@e2e.local' } },
  });

  await prisma.$disconnect();
}

export default globalTeardown;
