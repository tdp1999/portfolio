import { randomUUID } from 'crypto';
import { prisma } from './db';
import { TEST_EXP_PREFIX } from '../data/test-experiences';
import { TEST_USERS } from '../data/test-users';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function createTestExperience(
  companyName: string,
  positionEn: string,
  opts?: {
    positionVi?: string;
    startDate?: Date;
    endDate?: Date | null;
    employmentType?: string;
    locationType?: string;
    locationCountry?: string;
    slug?: string;
    skillIds?: string[];
  }
): Promise<{ id: string; slug: string; companyName: string }> {
  const id = randomUUID();
  const baseSlug = slugify(`${companyName} ${positionEn}`);

  // Ensure unique slug by checking DB
  let slug = opts?.slug ?? baseSlug;
  let counter = 2;
  while (await prisma.experience.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.experience.create({
    data: {
      id,
      slug,
      companyName,
      position: { en: positionEn, vi: opts?.positionVi ?? positionEn },
      achievements: { en: [], vi: [] },
      employmentType: (opts?.employmentType as never) ?? 'FULL_TIME',
      locationType: (opts?.locationType as never) ?? 'ONSITE',
      locationCountry: opts?.locationCountry ?? 'Vietnam',
      startDate: opts?.startDate ?? new Date('2022-01-01'),
      endDate: opts?.endDate,
      displayOrder: 0,
      createdById: TEST_USERS.admin.id,
      updatedById: TEST_USERS.admin.id,
    },
  });

  if (opts?.skillIds?.length) {
    await prisma.experienceSkill.createMany({
      data: opts.skillIds.map((skillId) => ({ experienceId: id, skillId })),
    });
  }

  return { id, slug, companyName };
}

export async function deleteTestExperiences(): Promise<void> {
  const experiences = await prisma.experience.findMany({
    where: { companyName: { startsWith: TEST_EXP_PREFIX } },
    select: { id: true },
  });
  const ids = experiences.map((e) => e.id);
  if (ids.length) {
    await prisma.experienceSkill.deleteMany({ where: { experienceId: { in: ids } } });
    await prisma.experience.deleteMany({ where: { id: { in: ids } } });
  }
}

export async function softDeleteTestExperience(id: string): Promise<void> {
  await prisma.experience.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: TEST_USERS.admin.id },
  });
}
