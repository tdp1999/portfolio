import { test, expect } from './fixtures/auth.fixture';
import { MediaPage, MediaTrashPage } from './pages/media.page';
import { TEST_MEDIA } from './data/test-media';
import { deleteTestMedia } from './helpers/db-media';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';

test.describe('Media Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await deleteTestMedia();
  });

  // ─── Navigation & Layout ───────────────────────────────────────

  test('can access /media and see heading + dropzone', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await expect(mediaPage.heading).toBeVisible();
    await expect(mediaPage.dropzone).toBeVisible();
  });

  test('sees Media link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/', { timeout: 10000 });

    const mediaLink = page.locator('a', { hasText: 'Media' });
    await expect(mediaLink).toBeVisible();
  });

  test('non-admin redirected away from /media', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    await page.goto('/media');
    await page.waitForURL('/', { timeout: 10000 });
  });

  // ─── Single Upload ─────────────────────────────────────────────

  test('uploads a single file → appears in grid + shows toast', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const filePath = MediaPage.createTestFile(TEST_MEDIA.upload.filename);
    await mediaPage.uploadFile(filePath);
    await mediaPage.waitForUploadComplete();

    await expectToast(page, 'uploaded successfully');
    // Reload to verify persistence
    await mediaPage.goto();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.upload.filename)).toBeVisible();
  });

  // ─── Bulk Upload ───────────────────────────────────────────────

  test('uploads multiple files → all appear in grid', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const file1 = MediaPage.createTestFile(TEST_MEDIA.bulk1.filename);
    const file2 = MediaPage.createTestFile(TEST_MEDIA.bulk2.filename);
    await mediaPage.uploadFiles([file1, file2]);

    // Wait for both upload responses
    let uploadCount = 0;
    await page.waitForResponse(
      (r) => {
        if (r.url().includes('/api/media/upload') && r.status() === 201) uploadCount++;
        return uploadCount >= 2;
      },
      { timeout: 30000 }
    );

    await mediaPage.goto();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.bulk1.filename)).toBeVisible();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.bulk2.filename)).toBeVisible();
  });

  // ─── File Validation ───────────────────────────────────────────

  test('rejects unsupported file type', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const filePath = MediaPage.createTestFileWithContent('test-invalid.exe', Buffer.from('fake exe'));
    await mediaPage.uploadFile(filePath);

    const error = page.locator('.text-red-500', { hasText: 'not allowed' });
    await expect(error).toBeVisible();
  });

  // ─── Metadata Edit ─────────────────────────────────────────────

  test('edit metadata: update alt text and caption', async ({ adminPage: page }) => {
    // Setup: ensure edit file exists
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const filePath = MediaPage.createTestFile(TEST_MEDIA.edit.filename);
    await mediaPage.uploadFile(filePath);
    await mediaPage.waitForUploadComplete();
    await mediaPage.goto();

    // Open edit dialog
    await mediaPage.clickEditOnCard(TEST_MEDIA.edit.filename);
    await expect(mediaPage.dialog.container).toBeVisible();

    // Fill metadata
    await mediaPage.dialog.altInput.fill(TEST_MEDIA.edit.alt);
    await mediaPage.dialog.captionInput.fill(TEST_MEDIA.edit.caption);
    await mediaPage.dialog.saveButton.click();

    await expectToast(page, 'Media updated');

    // Verify saved by reopening dialog
    await mediaPage.clickEditOnCard(TEST_MEDIA.edit.filename);
    await expect(mediaPage.dialog.altInput).toHaveValue(TEST_MEDIA.edit.alt);
    await expect(mediaPage.dialog.captionInput).toHaveValue(TEST_MEDIA.edit.caption);
    await mediaPage.dialog.cancelButton.click();
  });

  // ─── Grid/List Toggle ──────────────────────────────────────────

  test('switch to list view → table visible', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await mediaPage.switchToListView();
    await expect(mediaPage.table).toBeVisible();
  });

  test('switch back to grid view → grid visible', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // First switch to list, then back to grid
    await mediaPage.switchToListView();
    await expect(mediaPage.table).toBeVisible();

    await mediaPage.switchToGridView();
    await expect(mediaPage.gridView).toBeVisible();
  });

  // ─── Search/Filter ─────────────────────────────────────────────

  test('search filters media by filename', async ({ adminPage: page }) => {
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // Upload two files with distinct names
    const file1 = MediaPage.createTestFile(TEST_MEDIA.search.filename);
    const file2 = MediaPage.createTestFile(TEST_MEDIA.searchOther.filename);
    await mediaPage.uploadFiles([file1, file2]);
    await page.waitForTimeout(2000);
    await mediaPage.goto();

    await mediaPage.search('search-target');

    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.search.filename)).toBeVisible();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.searchOther.filename)).not.toBeVisible();
  });

  test('clear search shows all media', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await mediaPage.search('search-target');
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.searchOther.filename)).not.toBeVisible();

    await mediaPage.clearSearch();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.search.filename)).toBeVisible();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.searchOther.filename)).toBeVisible();
  });

  // ─── Soft Delete ───────────────────────────────────────────────

  test('delete media → removed from grid + appears in trash', async ({ adminPage: page }) => {
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // Upload a file to delete
    const filePath = MediaPage.createTestFile(TEST_MEDIA.delete.filename);
    await mediaPage.uploadFile(filePath);
    await mediaPage.waitForUploadComplete();
    await mediaPage.goto();

    // Delete it
    await mediaPage.clickDeleteOnCard(TEST_MEDIA.delete.filename);
    await clickConfirm(page);

    await expectToast(page, 'Media moved to trash');
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.delete.filename)).not.toBeVisible();

    // Verify in trash
    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();
    await expect(trashPage.getRowByFilename(TEST_MEDIA.delete.filename)).toBeVisible();
  });

  // ─── Restore ───────────────────────────────────────────────────

  test('restore from trash → back in main view', async ({ adminPage: page }) => {
    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();

    // Item should be in trash from previous delete test
    await expect(trashPage.getRowByFilename(TEST_MEDIA.delete.filename)).toBeVisible({ timeout: 5000 });

    await trashPage.restoreItem(TEST_MEDIA.delete.filename);

    await expectToast(page, 'restored');

    // Verify back in main view
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();
    await expect(mediaPage.getGridCardByFilename(TEST_MEDIA.delete.filename)).toBeVisible({ timeout: 10000 });
  });

  // ─── Trash Empty State ─────────────────────────────────────────

  test('trash shows empty state when no deleted items', async ({ adminPage: page }) => {
    // Clean up all test media first
    await deleteTestMedia();

    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();

    await expect(trashPage.emptyState).toBeVisible();
  });
});
