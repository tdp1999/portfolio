import { test, expect } from './fixtures/auth.fixture';
import { MediaPage, MediaTrashPage } from './pages/media.page';
import { TEST_MEDIA } from './data/test-media';
import { deleteTestMedia } from './helpers/db-media';
import { expectToast } from './helpers/toast';
import { clickConfirm } from './helpers/dialog';
import { ConsoleShell } from './pages/console-shell.page';

/**
 * `/media` was rebuilt out of shared components, so this file is mostly a re-selection.
 * The changes that alter what the tests *mean*, rather than just how they find things:
 *
 * - **Metadata editing is a drawer, not a dialog.** Clicking an item sets `?selected=<id>` and
 *   opens `console-media-drawer`; Save there is disabled until the form is dirty, and Delete
 *   lives in the same drawer instead of on each card.
 * - **List view is the same component as grid view.** `console-asset-grid` switches its own
 *   markup between `.asset-grid__item` cards and `.asset-grid__row` rows — there is no
 *   `<table>` to assert on, and no `mat-paginator` either (paging is internal to the grid).
 * - The upload toast counts files: "N file(s) uploaded successfully".
 */
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
    await expect(mediaPage.trashLink).toBeVisible();
  });

  test('sees Media link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/', { timeout: 10000 });

    // Scoped to the sidebar, and by route rather than text. A page-wide `hasText: 'Media'`
    // also matched the dashboard's "Media Files" stat card, which links to /media too — two
    // elements, so the assertion died on strict mode rather than on a missing link.
    const shell = new ConsoleShell(page);
    await expect(shell.navLinkByRoute('/media')).toBeVisible();
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

    await mediaPage.uploadFile(MediaPage.createTestFile(TEST_MEDIA.upload.filename));
    await mediaPage.waitForUploadComplete();

    await expectToast(page, 'uploaded successfully');

    // Search rather than scan page 1. `console-asset-grid` pages internally, so whether a fresh
    // upload is on the first page depends on how much media the database already holds — which is
    // why this passed in a full-suite run and failed in a subset run. Filtering is deterministic.
    await mediaPage.goto();
    await mediaPage.search(TEST_MEDIA.upload.filename);
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.upload.filename)).toBeVisible();
  });

  // ─── Bulk Upload ───────────────────────────────────────────────

  test('uploads multiple files → all appear in grid', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    let uploadCount = 0;
    const bothUploaded = page.waitForResponse(
      (r) => {
        if (r.url().includes('/api/media/upload') && r.status() === 201) uploadCount++;
        return uploadCount >= 2;
      },
      { timeout: 30000 }
    );

    await mediaPage.uploadFiles([
      MediaPage.createTestFile(TEST_MEDIA.bulk1.filename),
      MediaPage.createTestFile(TEST_MEDIA.bulk2.filename),
    ]);
    await bothUploaded;

    await mediaPage.goto();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.bulk1.filename)).toBeVisible();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.bulk2.filename)).toBeVisible();
  });

  // ─── File Validation ───────────────────────────────────────────

  test('rejects unsupported file type', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // The rejection is server-side, and it surfaces as a toast.
    //
    // `/media` mounts `console-asset-upload-zone` without an `accept`, so the zone defaults to
    // `*/*` and `validateFile()` returns early — the client-side `.upload-zone__errors` block the
    // old assertion waited on is never rendered for a bad *type*, only for a bad size. The `.exe`
    // is uploaded, `FileSecurityScanner` refuses it, and `onUploadFailed` shows
    // "N file(s) failed to upload". There is no "not allowed" string anywhere in the API.
    const upload = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(MediaPage.createTestFileWithContent('test-invalid.exe', Buffer.from('fake exe')));
    expect((await upload).status()).toBeGreaterThanOrEqual(400);

    await expectToast(page, 'failed to upload');

    // And nothing was stored.
    await mediaPage.goto();
    await mediaPage.search('test-invalid');
    await expect(mediaPage.getItemByFilename('test-invalid.exe')).toHaveCount(0);
  });

  // ─── Metadata Edit ─────────────────────────────────────────────

  test('drawer: update alt text and caption, then reopen to confirm', async ({ adminPage: page }) => {
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await mediaPage.uploadFile(MediaPage.createTestFile(TEST_MEDIA.edit.filename));
    await mediaPage.waitForUploadComplete();
    await mediaPage.goto();

    const drawer = await mediaPage.openDrawer(TEST_MEDIA.edit.filename);
    // Nothing typed yet, so Save is still disabled — that is the drawer's dirty guard.
    await expect(drawer.saveButton).toBeDisabled();

    await drawer.altInput.fill(TEST_MEDIA.edit.alt);
    await drawer.captionInput.fill(TEST_MEDIA.edit.caption);
    expect(await drawer.save()).toBe(200);

    await expectToast(page, 'Media updated');

    await mediaPage.goto();
    const reopened = await mediaPage.openDrawer(TEST_MEDIA.edit.filename);
    await expect(reopened.altInput).toHaveValue(TEST_MEDIA.edit.alt);
    await expect(reopened.captionInput).toHaveValue(TEST_MEDIA.edit.caption);
  });

  // ─── Grid/List Toggle ──────────────────────────────────────────

  test('list view renders rows, grid view renders cards', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // Own asset, then filter to it. Relying on `TEST_MEDIA.edit` left this test depending on an
    // upload made by an earlier test in the describe, and on that asset landing on page 1 of an
    // internally paginated grid — so it broke whenever the file ran alone or the library grew.
    await mediaPage.uploadFile(MediaPage.createTestFile(TEST_MEDIA.view.filename));
    await mediaPage.waitForUploadComplete();
    await mediaPage.goto();
    await mediaPage.search(TEST_MEDIA.view.filename);

    // One component renders both modes, so the same asset must be present either way — only the
    // modifier class changes.
    await mediaPage.switchToListView();
    await expect(mediaPage.listRows.first()).toBeVisible();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.view.filename)).toBeVisible();

    await mediaPage.switchToGridView();
    await expect(mediaPage.listRows).toHaveCount(0);
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.view.filename)).toBeVisible();
  });

  // ─── Search/Filter ─────────────────────────────────────────────

  test('search filters media by filename', async ({ adminPage: page }) => {
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    let uploadCount = 0;
    const bothUploaded = page.waitForResponse(
      (r) => {
        if (r.url().includes('/api/media/upload') && r.status() === 201) uploadCount++;
        return uploadCount >= 2;
      },
      { timeout: 30000 }
    );
    await mediaPage.uploadFiles([
      MediaPage.createTestFile(TEST_MEDIA.search.filename),
      MediaPage.createTestFile(TEST_MEDIA.searchOther.filename),
    ]);
    await bothUploaded;
    await mediaPage.goto();

    await mediaPage.search('search-target');

    await expect(mediaPage.getItemByFilename(TEST_MEDIA.search.filename)).toBeVisible();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.searchOther.filename)).toHaveCount(0);
  });

  test('clear search shows all media', async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await mediaPage.search('search-target');
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.searchOther.filename)).toHaveCount(0);

    await mediaPage.clearSearch();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.search.filename)).toBeVisible();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.searchOther.filename)).toBeVisible();
  });

  // ─── Soft Delete ───────────────────────────────────────────────

  test('delete from the drawer → out of the grid, into trash', async ({ adminPage: page }) => {
    await deleteTestMedia();
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    await mediaPage.uploadFile(MediaPage.createTestFile(TEST_MEDIA.delete.filename));
    await mediaPage.waitForUploadComplete();
    await mediaPage.goto();

    const drawer = await mediaPage.openDrawer(TEST_MEDIA.delete.filename);
    await drawer.deleteButton.click();
    await clickConfirm(page);

    await expectToast(page, 'Media moved to trash');
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.delete.filename)).toHaveCount(0);

    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();
    await expect(trashPage.getRowByFilename(TEST_MEDIA.delete.filename)).toBeVisible();
  });

  // ─── Restore ───────────────────────────────────────────────────

  test('restore from trash → back in main view', async ({ adminPage: page }) => {
    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();

    await expect(trashPage.getRowByFilename(TEST_MEDIA.delete.filename)).toBeVisible({ timeout: 5000 });

    await trashPage.restoreItem(TEST_MEDIA.delete.filename);
    await expectToast(page, 'restored');

    const mediaPage = new MediaPage(page);
    await mediaPage.goto();
    await expect(mediaPage.getItemByFilename(TEST_MEDIA.delete.filename)).toBeVisible({ timeout: 10000 });
  });

  // ─── Trash Empty State ─────────────────────────────────────────

  test('trash shows empty state when no deleted items', async ({ adminPage: page }) => {
    await deleteTestMedia();

    const trashPage = new MediaTrashPage(page);
    await trashPage.goto();

    await expect(trashPage.emptyState).toBeVisible();
  });
});
