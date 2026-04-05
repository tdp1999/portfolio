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
