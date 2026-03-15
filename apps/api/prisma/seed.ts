import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '@portfolio/shared/utils';
import { PasswordSchema } from '../src/modules/user/application/user.dto';
import { v7 as uuidv7 } from 'uuid';

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

  const result = PasswordSchema.safeParse(password);
  if (!result.success) {
    throw new Error(`ADMIN_PASSWORD validation failed: ${result.error.issues[0].message}`);
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

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedAdmin(prisma, process.env as SeedEnv);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
