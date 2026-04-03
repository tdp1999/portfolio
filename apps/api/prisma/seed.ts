import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';

// Inlined to avoid monorepo imports that don't exist in the Docker production image
const hashPassword = (password: string): Promise<string> => hash(password, 10);

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
const PASSWORD_ERROR =
  'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (#?!@$%^&*-)';

const validatePassword = (password: string): { success: boolean; error?: string } => {
  if (!PASSWORD_REGEX.test(password)) {
    return { success: false, error: PASSWORD_ERROR };
  }
  return { success: true };
};

interface SeedEnv {
  ADMIN_EMAIL?: string;
  ADMIN_NAME?: string;
  ADMIN_PASSWORD?: string;
}

export async function seedAdmin(prisma: Pick<PrismaClient, 'user'>, env: SeedEnv): Promise<void> {
  const email = env.ADMIN_EMAIL;
  const name = env.ADMIN_NAME;
  const password = env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error('Missing required environment variables: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD must all be set');
  }

  const result = validatePassword(password);
  if (!result.success) {
    throw new Error(`ADMIN_PASSWORD validation failed: ${result.error}`);
  }

  const hashedPassword = await hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email} — skipping`);
    return;
  }

  await prisma.user.create({
    data: {
      id: uuidv7(),
      email,
      name,
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user seeded: ${email}`);
}

export async function seedProfile(prisma: Pick<PrismaClient, 'user' | 'profile'>, env: SeedEnv): Promise<void> {
  const email = env.ADMIN_EMAIL;
  if (!email) throw new Error('Missing ADMIN_EMAIL');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('Admin user not found — skipping profile seed');
    return;
  }

  const existing = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (existing) {
    console.log(`Profile already exists for ${email} — skipping`);
    return;
  }

  const name = env.ADMIN_NAME ?? '';

  await prisma.profile.create({
    data: {
      id: uuidv7(),
      userId: user.id,
      fullName: { en: name, vi: name },
      title: { en: 'Full-stack Developer', vi: 'Lập trình viên Full-stack' },
      bioShort: { en: 'Portfolio in progress', vi: 'Portfolio đang được cập nhật' },
      yearsOfExperience: 0,
      email,
      preferredContactValue: '',
      locationCountry: '',
      locationCity: '',
      createdById: user.id,
      updatedById: user.id,
    },
  });

  console.log(`Profile seeded for: ${email}`);
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedAdmin(prisma, process.env as SeedEnv);
    await seedProfile(prisma, process.env as SeedEnv);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
