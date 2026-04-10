import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

async function globalTeardown(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
  const prisma = new PrismaClient({ adapter });

  // Clean up test experiences
  const testExps = await prisma.experience.findMany({
    where: { companyName: { startsWith: 'e2e-landing-exp-' } },
    select: { id: true },
  });
  if (testExps.length) {
    const ids = testExps.map((e) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }

  // Clean up test profiles
  await prisma.profile.deleteMany({
    where: { user: { email: 'test-admin@e2e.local' } },
  });

  // Clean up test projects
  const testProjects = await prisma.project.findMany({
    where: {
      OR: [{ title: { startsWith: 'e2e-' } }, { createdBy: { email: 'test-admin@e2e.local' } }],
    },
    select: { id: true },
  });
  if (testProjects.length) {
    const projIds = testProjects.map((p) => p.id);
    await prisma.technicalHighlight.deleteMany({ where: { projectId: { in: projIds } } });
    await prisma.projectImage.deleteMany({ where: { projectId: { in: projIds } } });
    await prisma.projectSkill.deleteMany({ where: { projectId: { in: projIds } } });
    await prisma.project.deleteMany({ where: { id: { in: projIds } } });
  }

  // Clean up test blog posts
  const testPosts = await prisma.blogPost.findMany({
    where: {
      OR: [{ title: { startsWith: 'e2e-' } }, { author: { email: 'test-admin@e2e.local' } }],
    },
    select: { id: true },
  });
  if (testPosts.length) {
    const postIds = testPosts.map((p) => p.id);
    await prisma.postCategory.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.postTag.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.blogPost.deleteMany({ where: { id: { in: postIds } } });
  }

  await prisma.$disconnect();
}

export default globalTeardown;
