import { test, expect } from './fixtures/auth.fixture';
import { TagsPage } from './pages/tags.page';
import { TEST_TAGS } from './data/test-tags';
import { createTestTag, deleteTestTags } from './helpers/db-tags';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

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

  // ─── Create ──────────────────────────────────────────────────────

  test('creates tag via dialog → appears in table + shows toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createTag(TEST_TAGS.create.name);

    await expectToast(page, 'Tag created successfully');
    await expect(tagsPage.getRowByName(TEST_TAGS.create.name)).toBeVisible();
  });

  test('dialog cancel → no tag created', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createButton.click();
    await tagsPage.dialog.nameInput.fill(TEST_TAGS.createCancel.name);
    await tagsPage.dialog.cancelButton.click();

    await expect(tagsPage.dialog.container).not.toBeVisible();
    await expect(tagsPage.getRowByName(TEST_TAGS.createCancel.name)).not.toBeVisible();
  });

  test('create validation: empty name', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createButton.click();
    const createBtn = tagsPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(tagsPage.dialog.container.getByText('Name is required')).toBeVisible();
    await tagsPage.dialog.cancelButton.click();
  });

  test('create validation: name > 50 chars', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.createButton.click();
    await tagsPage.dialog.nameInput.fill('a'.repeat(51));
    const createBtn = tagsPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(tagsPage.dialog.container.getByText('Name must be 50 characters or less')).toBeVisible();
    await tagsPage.dialog.cancelButton.click();
  });

  test('create server error: duplicate name', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    // Create via DB so we have a duplicate target
    await createTestTag(TEST_TAGS.duplicate.name);

    // Try to create duplicate via UI
    await tagsPage.createTag(TEST_TAGS.duplicate.name);

    await expect(tagsPage.dialog.serverError).toBeVisible();
    await tagsPage.dialog.cancelButton.click();
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit dialog pre-filled with current name', async ({ adminPage: page }) => {
    // Setup: ensure edit tag exists
    await deleteTestTags();
    await createTestTag(TEST_TAGS.edit.name);
    await createTestTag(TEST_TAGS.duplicate.name);

    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    const row = tagsPage.getRowByName(TEST_TAGS.edit.name);
    await row.locator('button', { has: page.locator('mat-icon', { hasText: 'edit' }) }).click();

    await expect(tagsPage.dialog.nameInput).toHaveValue(TEST_TAGS.edit.name);
    await tagsPage.dialog.cancelButton.click();
  });

  test('edits tag name → updated in table + shows toast', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.editTag(TEST_TAGS.edit.name, TEST_TAGS.edit.updated);

    await expectToast(page, 'Tag updated successfully');
    await expect(tagsPage.getRowByName(TEST_TAGS.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.editTag(TEST_TAGS.edit.updated, TEST_TAGS.duplicate.name);

    await expect(tagsPage.dialog.serverError).toBeVisible();
    await tagsPage.dialog.cancelButton.click();
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
    await expect(tagsPage.getRowByName(TEST_TAGS.delete.name)).not.toBeVisible();
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
    await expect(tagsPage.getRowByName(TEST_TAGS.searchOther.name)).not.toBeVisible();
  });

  test('clear search shows all tags', async ({ adminPage: page }) => {
    const tagsPage = new TagsPage(page);
    await tagsPage.goto();

    await tagsPage.search('search-tag');
    await expect(tagsPage.getRowByName(TEST_TAGS.searchOther.name)).not.toBeVisible();

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
