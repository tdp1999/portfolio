import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';

const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  try {
    const email = process.env['ADMIN_EMAIL'];
    const name = process.env['ADMIN_NAME'];
    const password = process.env['ADMIN_PASSWORD'];

    if (!email || !name || !password) {
      console.log('Skipping admin seed: ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD env vars required');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new Error(
        'ADMIN_PASSWORD must be at least 8 characters with uppercase, lowercase, number, and special character'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: uuidv7(),
        email,
        name,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log(`Admin user seeded: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
