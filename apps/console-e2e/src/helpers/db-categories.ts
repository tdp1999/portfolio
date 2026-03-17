import { randomUUID } from 'crypto';
import { prisma } from './db';
import { TEST_CATEGORY_PREFIX } from '../data/test-categories';
import { TEST_USERS } from '../data/test-users';

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export async function createTestCategory(
  name: string,
  opts?: { description?: string; displayOrder?: number }
): Promise<{ id: string; name: string }> {
  const id = randomUUID();
  await prisma.category.create({
    data: {
      id,
      name,
      slug: slugify(name),
      description: opts?.description ?? null,
      displayOrder: opts?.displayOrder ?? 0,
      createdById: TEST_USERS.admin.id,
      updatedById: TEST_USERS.admin.id,
    },
  });
  return { id, name };
}

export async function deleteTestCategories(): Promise<void> {
  await prisma.category.deleteMany({
    where: { name: { startsWith: TEST_CATEGORY_PREFIX } },
  });
}
