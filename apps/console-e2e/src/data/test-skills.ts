export const TEST_SKILL_PREFIX = 'e2e-skill-';

export const TEST_SKILLS = {
  create: {
    name: `${TEST_SKILL_PREFIX}create`,
    category: 'TECHNICAL',
    description: 'Test skill description',
    displayOrder: 1,
  },
  createCancel: { name: `${TEST_SKILL_PREFIX}cancel` },
  edit: {
    name: `${TEST_SKILL_PREFIX}edit`,
    updated: `${TEST_SKILL_PREFIX}edited`,
    category: 'TECHNICAL',
    updatedCategory: 'TOOLS',
    description: 'Original desc',
    updatedDescription: 'Updated desc',
    displayOrder: 2,
    updatedDisplayOrder: 5,
  },
  delete: { name: `${TEST_SKILL_PREFIX}delete`, category: 'TECHNICAL' },
  deleteCancel: { name: `${TEST_SKILL_PREFIX}delete-cancel`, category: 'TECHNICAL' },
  duplicate: { name: `${TEST_SKILL_PREFIX}duplicate`, category: 'TECHNICAL' },
  search: { name: `${TEST_SKILL_PREFIX}search`, category: 'TECHNICAL' },
  searchOther: { name: `${TEST_SKILL_PREFIX}other`, category: 'TOOLS' },
  parent: { name: `${TEST_SKILL_PREFIX}parent`, category: 'TECHNICAL' },
  child: { name: `${TEST_SKILL_PREFIX}child`, category: 'TECHNICAL' },
  childOfChild: { name: `${TEST_SKILL_PREFIX}child-of-child`, category: 'TECHNICAL' },
} as const;
