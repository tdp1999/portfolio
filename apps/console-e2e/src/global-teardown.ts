import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function globalTeardown(): Promise<void> {
  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-', endsWith: '@e2e.local' } },
  });

  await prisma.$disconnect();
}

export default globalTeardown;
