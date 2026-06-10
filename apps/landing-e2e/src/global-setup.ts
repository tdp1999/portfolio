import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
// The deterministic blog dataset lives in the api project's Prisma seed. `api` is an
// application (not a buildable lib) and exposes no npm-scope entry point for its seeds, so
// there is no `@portfolio/...` alias to import this through. Scoped disable for this single
// cross-project test-fixture import; not an allow-list change. Follow-up: extract the shared
// seed into a buildable lib (e.g. @portfolio/api/seeds) if more e2e suites need it.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { seedBlogPosts } from '../../api/prisma/seeds/blog-posts.seed';

config({ path: resolve(process.cwd(), '.env') });

const TEST_ADMIN = {
  id: '00000000-0000-4000-a000-000000e2e004',
  email: 'test-admin@e2e.local',
  password: 'TestPass1!',
  name: 'Landing E2E Admin',
  role: 'ADMIN' as const,
};

async function globalSetup(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string });
  const prisma = new PrismaClient({ adapter });

  // Clean up leftover E2E experience test data from previous runs
  const staleExps = await prisma.experience.findMany({
    where: { companyName: { startsWith: 'e2e-landing-exp-' } },
    select: { id: true },
  });
  if (staleExps.length) {
    const ids = staleExps.map((e) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }

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

  // Seed the deterministic blog dataset (4 categories + 10 tags + 6 media + 6
  // posts including 1 featured, 2 notes, 1 VI essay, 1 deep-dive, 1 retro).
  // The seed is idempotent — existing rows are detected and skipped, so re-runs
  // are safe across test executions. We point the seed at the *real* admin so
  // posts authored by `seedBlogPosts` survive separate dev `pnpm seed` runs
  // without duplication; if the production admin is missing in this DB, fall
  // back to the e2e test admin as the author.
  const realAdminEmail = process.env['ADMIN_EMAIL'];
  const realAdmin = realAdminEmail
    ? await prisma.user.findUnique({ where: { email: realAdminEmail }, select: { email: true } })
    : null;
  const blogAuthorEmail = realAdmin ? realAdmin.email : TEST_ADMIN.email;
  await seedBlogPosts(prisma, { ADMIN_EMAIL: blogAuthorEmail });

  await prisma.$disconnect();
}

export default globalSetup;
