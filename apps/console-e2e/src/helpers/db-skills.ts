import { randomUUID } from 'crypto';
import { prisma } from './db';
import { TEST_SKILL_PREFIX } from '../data/test-skills';
import { TEST_USERS } from '../data/test-users';

/** Simplified slugify for test data — only handles spaces. Test names must use alphanumeric chars only. */
function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

export async function createTestSkill(
  name: string,
  opts?: {
    category?: 'TECHNICAL' | 'TOOLS' | 'ADDITIONAL';
    description?: string;
    displayOrder?: number;
    parentSkillId?: string;
    isLibrary?: boolean;
  }
): Promise<{ id: string; name: string }> {
  const id = randomUUID();
  await prisma.skill.create({
    data: {
      id,
      name,
      slug: slugify(name),
      category: opts?.category ?? 'TECHNICAL',
      description: opts?.description ?? null,
      displayOrder: opts?.displayOrder ?? 0,
      parentSkillId: opts?.parentSkillId ?? null,
      isLibrary: opts?.isLibrary ?? false,
      createdById: TEST_USERS.admin.id,
      updatedById: TEST_USERS.admin.id,
    },
  });
  return { id, name };
}

export async function deleteTestSkills(): Promise<void> {
  // Delete children first (FK constraint)
  await prisma.skill.deleteMany({
    where: { name: { startsWith: TEST_SKILL_PREFIX }, parentSkillId: { not: null } },
  });
  await prisma.skill.deleteMany({
    where: { name: { startsWith: TEST_SKILL_PREFIX } },
  });
}
