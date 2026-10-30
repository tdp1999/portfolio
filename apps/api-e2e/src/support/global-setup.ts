import { config } from 'dotenv';
import { resolve } from 'path';
import { waitForPortOpen } from '@nx/node/utils';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

/* eslint-disable */

config({ path: resolve(__dirname, '../../../../.env') });

const TEST_ADMIN = {
  id: '00000000-0000-4000-a000-000000e2e004',
  email: 'test-admin@e2e.local',
  password: 'TestPass1!',
  name: 'API E2E Admin',
  role: 'ADMIN' as const,
};

// A signed-in account without the ADMIN role, for the 403 cells of 'DT-3 Phân quyền' (medicine cabinet).
const TEST_USER = {
  id: '00000000-0000-4000-a000-000000e2e005',
  email: 'test-user@e2e.local',
  password: 'TestPass1!',
  name: 'API E2E User',
  role: 'USER' as const,
};

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // Seed test admin and user accounts
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  for (const account of [TEST_ADMIN, TEST_USER]) {
    const hashed = await hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      create: {
        id: account.id,
        email: account.email,
        password: hashed,
        name: account.name,
        role: account.role,
      },
      update: { password: hashed, role: account.role },
    });
  }

  await prisma.$disconnect();

  (globalThis as Record<string, unknown>).__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
