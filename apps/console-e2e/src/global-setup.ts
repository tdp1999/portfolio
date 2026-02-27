import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@portfolio/shared/utils';
import { TEST_USERS } from './data/test-users';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function globalSetup(): Promise<void> {
  const hashedStandard = await hashPassword(TEST_USERS.standard.password);
  const hashedLocked = await hashPassword(TEST_USERS.locked.password);

  // Clean up any leftover test users first
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-', endsWith: '@e2e.local' } },
  });

  // Seed standard user
  await prisma.user.create({
    data: {
      id: TEST_USERS.standard.id,
      email: TEST_USERS.standard.email,
      password: hashedStandard,
      name: TEST_USERS.standard.name,
    },
  });

  // Seed Google-only user (no password)
  await prisma.user.create({
    data: {
      id: TEST_USERS.googleOnly.id,
      email: TEST_USERS.googleOnly.email,
      password: null,
      name: TEST_USERS.googleOnly.name,
      googleId: TEST_USERS.googleOnly.googleId,
    },
  });

  // Seed locked user
  await prisma.user.create({
    data: {
      id: TEST_USERS.locked.id,
      email: TEST_USERS.locked.email,
      password: hashedLocked,
      name: TEST_USERS.locked.name,
      failedLoginAttempts: TEST_USERS.locked.failedLoginAttempts,
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // locked for 30 min
    },
  });

  await prisma.$disconnect();
}

export default globalSetup;
