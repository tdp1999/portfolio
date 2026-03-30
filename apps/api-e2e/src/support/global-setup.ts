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

module.exports = async function () {
  console.log('\nSetting up...\n');

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // Seed test admin user
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  const hashed = await hash(TEST_ADMIN.password, 10);
  await prisma.user.upsert({
    where: { email: TEST_ADMIN.email },
    create: {
      id: TEST_ADMIN.id,
      email: TEST_ADMIN.email,
      password: hashed,
      name: TEST_ADMIN.name,
      role: TEST_ADMIN.role,
    },
    update: { password: hashed, role: TEST_ADMIN.role },
  });

  await prisma.$disconnect();

  (globalThis as Record<string, unknown>).__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
