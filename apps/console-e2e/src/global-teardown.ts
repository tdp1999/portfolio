import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

config({ path: resolve(process.cwd(), '.env') });

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] as string });
const prisma = new PrismaClient({ adapter });

async function globalTeardown(): Promise<void> {
  // Delete experiences before users (FK constraint: experiences_createdById_fkey / updatedById_fkey)
  const testExps = await prisma.experience.findMany({
    where: {
      OR: [
        { companyName: { startsWith: 'e2e-' } },
        { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
        { updatedBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
      ],
    },
    select: { id: true },
  });
  if (testExps.length) {
    const ids = testExps.map((e) => e.id);
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }

  // Delete profiles before users (FK constraint: profiles_userId_fkey)
  await prisma.profile.deleteMany({
    where: { user: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
  });

  // Delete projects before users (FK constraint: projects_createdById_fkey)
  const testProjects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { startsWith: 'e2e-' } },
        { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
      ],
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

  // Delete blog posts before users (FK constraint: blog_posts_authorId_fkey)
  const testPosts = await prisma.blogPost.findMany({
    where: {
      OR: [{ title: { startsWith: 'e2e-' } }, { author: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } }],
    },
    select: { id: true },
  });
  if (testPosts.length) {
    const postIds = testPosts.map((p) => p.id);
    await prisma.postCategory.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.postTag.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.blogPost.deleteMany({ where: { id: { in: postIds } } });
  }

  // Delete skills created by test users (FK constraint: skills_createdById_fkey)
  const testSkills = await prisma.skill.findMany({
    where: { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
    select: { id: true },
  });
  if (testSkills.length) {
    const skillIds = testSkills.map((s) => s.id);
    await prisma.experienceSkill.deleteMany({ where: { skillId: { in: skillIds } } });
    await prisma.projectSkill.deleteMany({ where: { skillId: { in: skillIds } } });
    await prisma.skill.deleteMany({ where: { id: { in: skillIds } } });
  }

  // Delete categories created by test users (FK constraint: categories_createdById_fkey)
  const testCats = await prisma.category.findMany({
    where: { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
    select: { id: true },
  });
  if (testCats.length) {
    const catIds = testCats.map((c) => c.id);
    await prisma.category.deleteMany({ where: { id: { in: catIds } } });
  }

  // Delete tags created by test users (FK constraint: tags_createdById_fkey)
  const testTags = await prisma.tag.findMany({
    where: { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
    select: { id: true },
  });
  if (testTags.length) {
    const tagIds = testTags.map((t) => t.id);
    await prisma.tag.deleteMany({ where: { id: { in: tagIds } } });
  }

  // Delete media created by test users (FK constraint: media_createdById_fkey)
  const testMedia = await prisma.media.findMany({
    where: { createdBy: { email: { startsWith: 'test-', endsWith: '@e2e.local' } } },
    select: { id: true },
  });
  if (testMedia.length) {
    const mediaIds = testMedia.map((m) => m.id);
    await prisma.media.deleteMany({ where: { id: { in: mediaIds } } });
  }

  await prisma.user.deleteMany({
    where: { email: { startsWith: 'test-', endsWith: '@e2e.local' } },
  });

  await prisma.$disconnect();
}

export default globalTeardown;
