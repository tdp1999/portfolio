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
  const hashedAdmin = await hashPassword(TEST_USERS.admin.password);

  // Clean up test experiences (reference test users via FK — must delete first)
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

  // Seed admin user
  await prisma.user.create({
    data: {
      id: TEST_USERS.admin.id,
      email: TEST_USERS.admin.email,
      password: hashedAdmin,
      name: TEST_USERS.admin.name,
      role: TEST_USERS.admin.role,
    },
  });

  await prisma.$disconnect();
}

export default globalSetup;
