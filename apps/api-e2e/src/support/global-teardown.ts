import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/* eslint-disable */

config({ path: resolve(__dirname, '../../../../.env') });

module.exports = async function () {
  // Clean up test admin user
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  // Clean up test profiles before users (FK constraint: profiles_userId_fkey)
  await prisma.profile.deleteMany({
    where: { user: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
  });
  // Clean up experiences referencing test users (FK constraint: experiences_createdById_fkey / updatedById_fkey)
  const testExps = await prisma.experience.findMany({
    where: {
      OR: [
        { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
        { updatedBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
      ],
    },
    select: { id: true },
  });
  if (testExps.length) {
    const ids = testExps.map((e: { id: string }) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }
  // Clean up test admin user
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-', endsWith: '@e2e.local' } },
  });
  // Clean up test contact messages
  await prisma.contactMessage.deleteMany({
    where: { email: { endsWith: '@test-safe.com' } },
  });

  await prisma.$disconnect();

  // Only kill port in CI (Nx manages the server lifecycle)
  if (process.env.CI) {
    const { killPort } = await import('@nx/node/utils');
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await killPort(port);
  }

  console.log((globalThis as Record<string, unknown>).__TEARDOWN_MESSAGE__);
};
