export const TEST_MEDIA_PREFIX = 'e2e-media-';

/** Small 1x1 PNG as base64 for test uploads */
export const TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const TEST_MEDIA = {
  upload: { filename: `${TEST_MEDIA_PREFIX}upload.png` },
  bulk1: { filename: `${TEST_MEDIA_PREFIX}bulk-1.png` },
  bulk2: { filename: `${TEST_MEDIA_PREFIX}bulk-2.png` },
  edit: { filename: `${TEST_MEDIA_PREFIX}edit.png`, alt: 'Test alt text', caption: 'Test caption' },
  delete: { filename: `${TEST_MEDIA_PREFIX}delete.png` },
  search: { filename: `${TEST_MEDIA_PREFIX}search-target.png` },
  searchOther: { filename: `${TEST_MEDIA_PREFIX}other-file.png` },
} as const;
