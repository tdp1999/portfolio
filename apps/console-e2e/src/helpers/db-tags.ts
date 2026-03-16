import { randomUUID } from 'crypto';
import { prisma } from './db';
import { TEST_TAG_PREFIX } from '../data/test-tags';
import { TEST_USERS } from '../data/test-users';

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export async function createTestTag(name: string): Promise<{ id: string; name: string }> {
  const id = randomUUID();
  await prisma.tag.create({
    data: {
      id,
      name,
      slug: slugify(name),
      createdById: TEST_USERS.admin.id,
      updatedById: TEST_USERS.admin.id,
    },
  });
  return { id, name };
}

export async function deleteTestTags(): Promise<void> {
  await prisma.tag.deleteMany({
    where: { name: { startsWith: TEST_TAG_PREFIX } },
  });
}
