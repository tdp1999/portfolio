import { test, expect } from './fixtures/auth.fixture';
import { TagsPage } from './pages/tags.page';
import { TagFormPage } from './pages/tag-form.page';
import { TEST_TAGS } from './data/test-tags';
import { createTestTag, deleteTestTags } from './helpers/db-tags';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

/**
 * Create and edit are routed pages (`/tags/new`, `/tags/:id/edit`) with a sticky save bar, not
 * `mat-dialog-container`s. Three consequences run through this file:
 *
 * - "cancel the dialog" is now "navigate away without saving";
 * - "server error inside the dialog" is now an error toast from the HTTP interceptor, because a
 *   `ConflictError` carries no `fieldErrors` for `ServerErrorDirective` to bind to a control;
 * - the success toasts are "Tag created" / "Tag updated", **not** "…successfully". Only the
 *   delete toast, which the list page owns, says "Tag deleted successfully".
 *
 * Validation copy is matched loosely on purpose. `validation-messages.ts` is field-agnostic
 * ("This field is required."), so pinning an exact per-field sentence couples the suite to
 * wording it does not own — the failure mode that made these specs stale in the first place.
 */
test.describe('Tag Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await deleteTestTags();
  });

  // ─── List & Navigation ───────────────────────────────────────────

  test('can access /tags and see table + pagination', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await expect(tagsPage.heading).toBeVisible();
    await expect(tagsPage.table).toBeVisible();
    await expect(tagsPage.paginator).toBeVisible();
  });

  test('sees Tags link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/', { timeout: 10000 });

    const tagsLink = page.locator('a', { hasText: 'Tags' });
    await expect(tagsLink).toBeVisible();
  });

  test('Create Tag is a link to /tags/new, not a dialog trigger', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createLink.click();

    await expect(page).toHaveURL(/\/tags\/new$/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  // ─── Create ──────────────────────────────────────────────────────

  test('creates tag → appears in table + shows toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createTag(TEST_TAGS.create.name);

    await expectToast(page, 'Tag created');
    await tagsPage.goto();
    await expect(tagsPage.getRowByName(TEST_TAGS.create.name)).toBeVisible();
  });

  test('leaving the form without saving → no tag created', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    const form = await tagsPage.openCreateForm();
    await form.fillName(TEST_TAGS.createCancel.name);
    await form.discardButton.click();

    await tagsPage.goto();
    await expect(tagsPage.getRowByName(TEST_TAGS.createCancel.name)).toHaveCount(0);
  });

  test('create validation: empty name blocks the save', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    await form.saveButton.click();

    await expect(form.nameError).toHaveText(/required/i);
    // Still on the form: an invalid submit must not navigate.
    await expect(page).toHaveURL(/\/tags\/new$/);
  });

  test('create validation: name over the 50-char limit', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    await form.fillName('a'.repeat(51));
    await form.saveButton.click();

    await expect(form.nameError).toHaveText(/50 characters or less/i);
    await expect(page).toHaveURL(/\/tags\/new$/);
  });

  test('create server error: duplicate name → error toast', async ({ adminPage: page }) => {
    await createTestTag(TEST_TAGS.duplicate.name);

    const form = new TagFormPage(page);
    await form.gotoNew();
    await form.fillName(TEST_TAGS.duplicate.name);
    await form.saveButton.click();

    await expectToast(page, 'A tag with this name already exists.');
    await expect(page).toHaveURL(/\/tags\/new$/);
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit form pre-filled with current name', async ({ adminPage: page }) => {
    await deleteTestTags();
    await createTestTag(TEST_TAGS.edit.name);
    await createTestTag(TEST_TAGS.duplicate.name);

    const tagsPage = new TagsPage(page);
    await tagsPage.goto();
    const form = await tagsPage.openEditForm(TEST_TAGS.edit.name);

    await expect(form.nameInput).toHaveValue(TEST_TAGS.edit.name);
    // Nothing has changed yet, so there is nothing to discard.
    await expect(form.discardButton).toHaveCount(0);
  });

  test('edits tag name → updated in table + shows toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.editTag(TEST_TAGS.edit.name, TEST_TAGS.edit.updated);

    await expectToast(page, 'Tag updated');
    await tagsPage.goto();
    await expect(tagsPage.getRowByName(TEST_TAGS.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name → error toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    const form = await tagsPage.openEditForm(TEST_TAGS.edit.updated);
    await form.fillName(TEST_TAGS.duplicate.name);
    await form.saveButton.click();

    await expectToast(page, 'A tag with this name already exists.');
  });

  // ─── Delete ──────────────────────────────────────────────────────

  test('cancel on confirm dialog → tag remains', async ({ adminPage: page }) => {
    await deleteTestTags();
    await createTestTag(TEST_TAGS.delete.name);
    await createTestTag(TEST_TAGS.deleteCancel.name);

    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.clickDeleteOnRow(TEST_TAGS.deleteCancel.name);
    await clickCancel(page);

    await expect(tagsPage.getRowByName(TEST_TAGS.deleteCancel.name)).toBeVisible();
  });

  test('deletes tag after confirm → disappears + shows toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.clickDeleteOnRow(TEST_TAGS.delete.name);
    await clickConfirm(page);

    await expectToast(page, 'Tag deleted successfully');
    await expect(tagsPage.getRowByName(TEST_TAGS.delete.name)).toHaveCount(0);
  });

  // ─── Search ──────────────────────────────────────────────────────

  test('search filters tags by name', async ({ adminPage: page }) => {
    await deleteTestTags();
    await createTestTag(TEST_TAGS.search.name);
    await createTestTag(TEST_TAGS.searchOther.name);

    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.search('search-tag');

    await expect(tagsPage.getRowByName(TEST_TAGS.search.name)).toBeVisible();
    await expect(tagsPage.getRowByName(TEST_TAGS.searchOther.name)).toHaveCount(0);
  });

  test('clear search shows all tags', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.search('search-tag');
    await expect(tagsPage.getRowByName(TEST_TAGS.searchOther.name)).toHaveCount(0);

    await tagsPage.clearSearch();

    await expect(tagsPage.getRowByName(TEST_TAGS.search.name)).toBeVisible();
    await expect(tagsPage.getRowByName(TEST_TAGS.searchOther.name)).toBeVisible();
  });

  // ─── Access Control ──────────────────────────────────────────────

  test('non-admin redirected away from /tags', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    await page.goto('/tags');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('non-admin does not see Tags in sidebar', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    const tagsLink = page.locator('a', { hasText: 'Tags' });
    await expect(tagsLink).not.toBeVisible();
  });
});
