export const TEST_CATEGORY_PREFIX = 'e2e-cat-';

export const TEST_CATEGORIES = {
  create: { name: `${TEST_CATEGORY_PREFIX}create`, description: 'Test create description', displayOrder: 1 },
  createCancel: { name: `${TEST_CATEGORY_PREFIX}cancel` },
  edit: {
    name: `${TEST_CATEGORY_PREFIX}edit`,
    updated: `${TEST_CATEGORY_PREFIX}edited`,
    description: 'Original desc',
    updatedDescription: 'Updated desc',
    displayOrder: 2,
    updatedDisplayOrder: 5,
  },
  delete: { name: `${TEST_CATEGORY_PREFIX}delete` },
  deleteCancel: { name: `${TEST_CATEGORY_PREFIX}delete-cancel` },
  duplicate: { name: `${TEST_CATEGORY_PREFIX}duplicate` },
  search: { name: `${TEST_CATEGORY_PREFIX}search` },
  searchOther: { name: `${TEST_CATEGORY_PREFIX}other` },
} as const;
