export const TEST_MEDIA_PREFIX = 'e2e-media-';

/** Small 1x1 PNG as base64 for test uploads */
export const TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * A real single-page PDF (539 bytes), not PNG bytes under a `.pdf` name.
 *
 * `FileSecurityScanner.validate` compares magic bytes against the declared MIME type — which
 * Playwright derives from the file extension — and rejects a mismatch as a security threat.
 * Anything that needs the resume or certification picker (`mimeFilter: 'application/pdf'`)
 * must upload this, or the upload 400s and the picker grid comes back empty.
 */
export const TEST_PDF_BASE64 =
  'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0vUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pi9Db250ZW50cyA1IDAgUj4+ZW5kb2JqCjQgMCBvYmo8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PmVuZG9iago1IDAgb2JqPDwvTGVuZ3RoIDQ0Pj5zdHJlYW0KQlQgL0YxIDE4IFRmIDIwIDEwMCBUZCAoZTJlIGZpeHR1cmUpIFRqIEVUCmVuZHN0cmVhbSBlbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTIgMDAwMDAgbiAKMDAwMDAwMDEwMSAwMDAwMCBuIAowMDAwMDAwMjExIDAwMDAwIG4gCjAwMDAwMDAyNzIgMDAwMDAgbiAKdHJhaWxlcjw8L1NpemUgNi9Sb290IDEgMCBSPj4Kc3RhcnR4cmVmCjM2MAolJUVPRgo=';

export const TEST_MEDIA = {
  upload: { filename: `${TEST_MEDIA_PREFIX}upload.png` },
  bulk1: { filename: `${TEST_MEDIA_PREFIX}bulk-1.png` },
  bulk2: { filename: `${TEST_MEDIA_PREFIX}bulk-2.png` },
  edit: { filename: `${TEST_MEDIA_PREFIX}edit.png`, alt: 'Test alt text', caption: 'Test caption' },
  delete: { filename: `${TEST_MEDIA_PREFIX}delete.png` },
  /** Owned by the grid/list toggle test, so it does not depend on another test's upload. */
  view: { filename: `${TEST_MEDIA_PREFIX}view-toggle.png` },
  search: { filename: `${TEST_MEDIA_PREFIX}search-target.png` },
  searchOther: { filename: `${TEST_MEDIA_PREFIX}other-file.png` },
} as const;
