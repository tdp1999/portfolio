import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, SkillCategory } from '@prisma/client';
import { hash } from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';

import { seedBlogPosts } from './seeds/blog-posts.seed';

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

  const name = env.ADMIN_NAME || 'Admin';

  await prisma.profile.create({
    data: {
      id: uuidv7(),
      userId: user.id,
      fullName: { en: name, vi: name },
      title: { en: 'Frontend Engineer', vi: 'Kỹ sư Frontend' },
      bioShort: {
        en: 'Five years in, four with a Singapore-based product team. I have come to like the feature work nobody asks me to brag about — the design system before the screen, the test before the bug, the workflow before the task. Less glamorous; more durable.',
        vi: '',
      },
      // Landing content blocks (E2 §1, §4, §5, §7 locked copy)
      tagline: {
        en: 'Four years shipping fintech tools for the Singapore market. Document engines, loan systems, permission frameworks.',
        vi: '',
      },
      stackIntro: {
        en: "Daily, I reach for **Angular**, **TypeScript**, and **Angular Material**.\n\nBeyond that: **RxJS** when I need streams, **signals** when I don't, a custom **TipTap** extension when the editor work goes deep.\n\nWhen the work needs a backend too, **NestJS** + **Prisma** + **Postgres** with DDD. Tests in **Jest** and **Playwright**. I write the design system before reaching for a UI library.",
        vi: '',
      },
      selectedWorkIntro: {
        en: 'Three projects. A console, a fintech engine, an editor I had to ship myself.',
        vi: '',
      },
      contactIntro: {
        en: "I'm in HCMC, working with the Singapore market. Open to full-time roles, and a small slice of freelance on the side, full-stack with frontend depth.",
        vi: '',
      },
      footerTagline: {
        en: "There's more, if you're still here.",
        vi: '',
      },
      coreStack: ['Angular', 'TypeScript', 'Angular Material'],
      yearsOfExperience: 5,
      timezones: ['Asia/Ho_Chi_Minh'],
      workingHours: { start: '09:00', end: '18:00' },
      email,
      preferredContactValue: email,
      locationCountry: 'Vietnam',
      locationCity: 'Ho Chi Minh City',
      createdById: user.id,
      updatedById: user.id,
    },
  });

  console.log(`Profile seeded for: ${email}`);
}

// 6 umbrella skills for landing Tier 2 grouping (E2 §4 / domain rule PRF-008)
// Each is a top-level skill (parentSkillId = null) acting as a group anchor.
// Member skills attach to one umbrella by setting parentSkillId.
const UMBRELLA_SKILLS = [
  { slug: 'languages', name: 'Languages', category: SkillCategory.TECHNICAL, displayOrder: 1 },
  { slug: 'frontend', name: 'Frontend', category: SkillCategory.TECHNICAL, displayOrder: 2 },
  { slug: 'library-work', name: 'Library work', category: SkillCategory.TECHNICAL, displayOrder: 3 },
  { slug: 'backend', name: 'Backend', category: SkillCategory.TECHNICAL, displayOrder: 4 },
  { slug: 'tooling', name: 'Tooling', category: SkillCategory.TOOLS, displayOrder: 5 },
  { slug: 'workflow-and-ai', name: 'Workflow & AI', category: SkillCategory.TOOLS, displayOrder: 6 },
];

export async function seedSkillUmbrellas(prisma: Pick<PrismaClient, 'user' | 'skill'>, env: SeedEnv): Promise<void> {
  const email = env.ADMIN_EMAIL;
  if (!email) throw new Error('Missing ADMIN_EMAIL');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('Admin user not found — skipping umbrella seed');
    return;
  }

  for (const u of UMBRELLA_SKILLS) {
    const existing = await prisma.skill.findFirst({
      where: { slug: u.slug, parentSkillId: null, deletedAt: null },
    });
    if (existing) {
      console.log(`Umbrella "${u.name}" already exists — skipping`);
      continue;
    }
    await prisma.skill.create({
      data: {
        id: uuidv7(),
        slug: u.slug,
        name: u.name,
        category: u.category,
        parentSkillId: null,
        displayOrder: u.displayOrder,
        isFeatured: false,
        createdById: user.id,
        updatedById: user.id,
      },
    });
    console.log(`Umbrella skill seeded: ${u.name}`);
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedAdmin(prisma, process.env as SeedEnv);
    await seedProfile(prisma, process.env as SeedEnv);
    await seedSkillUmbrellas(prisma, process.env as SeedEnv);
    await seedBlogPosts(prisma, process.env as SeedEnv);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
