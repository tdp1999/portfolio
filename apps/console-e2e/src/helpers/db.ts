import { config } from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@portfolio/shared/utils';
import { TEST_EMAIL_DOMAIN, TEST_EMAIL_PREFIX } from '../data/test-users';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string });
const prisma = new PrismaClient({ adapter });

interface TempUser {
  email: string;
  password: string;
}

/**
 * Creates a disposable test user with a unique email.
 * Always clean up with `deleteTempUser(email)` in afterEach/finally.
 */
async function createTempUser(suffix: string, password = 'TestPass1!'): Promise<TempUser> {
  const email = `${TEST_EMAIL_PREFIX}${suffix}${TEST_EMAIL_DOMAIN}`;
  const hashed = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    create: { id: randomUUID(), email, password: hashed, name: `Temp ${suffix}` },
    update: { password: hashed, lockedUntil: null },
  });
  return { email, password };
}

async function deleteTempUser(email: string): Promise<void> {
  await prisma.user.deleteMany({ where: { email } });
}

export { prisma, createTempUser, deleteTempUser };
