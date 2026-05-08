export type PublicSkill = {
  id: string;
  name: string;
  slug: string;
  category: 'TECHNICAL' | 'TOOLS' | 'ADDITIONAL';
  isLibrary: boolean;
  parentSkillId: string | null;
  yearsOfExperience: number | null;
  iconId: string | null;
  iconUrl: string | null;
  proficiencyNote: string | null;
  isFeatured: boolean;
  displayOrder: number;
};

/** Slugs for the 6 umbrella skills seeded in `apps/api/prisma/seed.ts`. */
export const UMBRELLA_SLUGS = [
  'languages',
  'frontend',
  'library-work',
  'backend',
  'tooling',
  'workflow-and-ai',
] as const;

export type UmbrellaSlug = (typeof UMBRELLA_SLUGS)[number];

export type SkillGroup = {
  readonly slug: UmbrellaSlug;
  readonly label: string;
  readonly members: readonly PublicSkill[];
};
