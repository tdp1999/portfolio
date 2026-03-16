export const TEST_TAG_PREFIX = 'e2e-';

export const TEST_TAGS = {
  create: { name: `${TEST_TAG_PREFIX}create-tag` },
  createCancel: { name: `${TEST_TAG_PREFIX}cancel-tag` },
  edit: { name: `${TEST_TAG_PREFIX}edit-tag`, updated: `${TEST_TAG_PREFIX}edited-tag` },
  delete: { name: `${TEST_TAG_PREFIX}delete-tag` },
  deleteCancel: { name: `${TEST_TAG_PREFIX}delete-cancel-tag` },
  duplicate: { name: `${TEST_TAG_PREFIX}duplicate-tag` },
  search: { name: `${TEST_TAG_PREFIX}search-tag` },
  searchOther: { name: `${TEST_TAG_PREFIX}other-tag` },
} as const;
