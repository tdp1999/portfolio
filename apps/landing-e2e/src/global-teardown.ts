import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

async function globalTeardown(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  // Clean up test profiles
  await prisma.profile.deleteMany({
    where: { user: { email: 'test-admin@e2e.local' } },
  });

  await prisma.$disconnect();
}

export default globalTeardown;
