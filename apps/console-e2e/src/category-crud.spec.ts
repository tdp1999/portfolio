import { test, expect } from './fixtures/auth.fixture';
import { CategoriesPage } from './pages/categories.page';
import { CategoryFormPage } from './pages/category-form.page';
import { TEST_CATEGORIES } from './data/test-categories';
import { createTestCategory, deleteTestCategories } from './helpers/db-categories';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

/**
 * Same routed-form story as `tag-crud`: `/categories/new` and `/categories/:id/edit` replaced the
 * create/edit dialogs, so a duplicate name is an interceptor toast rather than an error inside a
 * dialog, and the success toasts are "Category created" / "Category updated" without
 * "successfully". Only the list page's delete toast says "Category deleted successfully".
 *
 * Unlike the skill and experience forms, this one has two `console-section-card`s but **no**
 * `console-section-tabs` — nothing is `[hidden]`, so Display Order needs no activation.
 */
test.describe('Category Management', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await deleteTestCategories();
  });

  // ─── List & Navigation ───────────────────────────────────────────

  test('can access /categories and see table + pagination', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await expect(categoriesPage.heading).toBeVisible();
    await expect(categoriesPage.table).toBeVisible();
    await expect(categoriesPage.paginator).toBeVisible();
  });

  test('sees Categories link in sidebar', async ({ adminPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/', { timeout: 10000 });

    const categoriesLink = page.locator('a', { hasText: 'Categories' });
    await expect(categoriesLink).toBeVisible();
  });

  test('Create Category is a link to /categories/new, not a dialog trigger', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createLink.click();

    await expect(page).toHaveURL(/\/categories\/new$/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  // ─── Create ──────────────────────────────────────────────────────

  test('creates category with all fields → appears in table + shows toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createCategory(TEST_CATEGORIES.create.name, {
      description: TEST_CATEGORIES.create.description,
      displayOrder: TEST_CATEGORIES.create.displayOrder,
    });

    await expectToast(page, 'Category created');
    await categoriesPage.goto();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.create.name)).toBeVisible();
  });

  test('leaving the form without saving → no category created', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    const form = await categoriesPage.openCreateForm();
    await form.fill({ name: TEST_CATEGORIES.createCancel.name });
    await form.discardButton.click();

    await categoriesPage.goto();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.createCancel.name)).toHaveCount(0);
  });

  test('create validation: empty name blocks the save', async ({ adminPage: page }) => {
    const form = new CategoryFormPage(page);
    await form.gotoNew();

    await form.saveButton.click();

    await expect(form.nameError).toHaveText(/required/i);
    await expect(page).toHaveURL(/\/categories\/new$/);
  });

  test('create validation: name over the 100-char limit', async ({ adminPage: page }) => {
    const form = new CategoryFormPage(page);
    await form.gotoNew();

    await form.fill({ name: 'a'.repeat(101) });
    await form.saveButton.click();

    await expect(form.nameError).toHaveText(/100 characters or less/i);
    await expect(page).toHaveURL(/\/categories\/new$/);
  });

  test('create validation: negative display order blocks the save', async ({ adminPage: page }) => {
    const form = new CategoryFormPage(page);
    await form.gotoNew();

    await form.fill({ name: `${TEST_CATEGORIES.create.name}-order`, displayOrder: -1 });
    await form.saveButton.click();

    // `baselineFor.displayOrder()` is `integerValidator + Validators.min(LIMITS.DISPLAY_ORDER_MIN)`.
    await expect(form.errorFor('displayOrder')).toHaveText(/at least 0/i);
    await expect(page).toHaveURL(/\/categories\/new$/);
  });

  test('create server error: duplicate name → error toast', async ({ adminPage: page }) => {
    await createTestCategory(TEST_CATEGORIES.duplicate.name);

    const form = new CategoryFormPage(page);
    await form.gotoNew();
    await form.fill({ name: TEST_CATEGORIES.duplicate.name });
    await form.saveButton.click();

    await expectToast(page, 'A category with this name already exists.');
    await expect(page).toHaveURL(/\/categories\/new$/);
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit form pre-filled with current values', async ({ adminPage: page }) => {
    await deleteTestCategories();
    await createTestCategory(TEST_CATEGORIES.edit.name, {
      description: TEST_CATEGORIES.edit.description,
      displayOrder: TEST_CATEGORIES.edit.displayOrder,
    });
    await createTestCategory(TEST_CATEGORIES.duplicate.name);

    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();
    const form = await categoriesPage.openEditForm(TEST_CATEGORIES.edit.name);

    await expect(form.nameInput).toHaveValue(TEST_CATEGORIES.edit.name);
    await expect(form.descriptionInput).toHaveValue(TEST_CATEGORIES.edit.description);
    await expect(form.displayOrderInput).toHaveValue(String(TEST_CATEGORIES.edit.displayOrder));
  });

  test('edits category → updated in table + shows toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.editCategory(TEST_CATEGORIES.edit.name, {
      name: TEST_CATEGORIES.edit.updated,
      description: TEST_CATEGORIES.edit.updatedDescription,
      displayOrder: TEST_CATEGORIES.edit.updatedDisplayOrder,
    });

    await expectToast(page, 'Category updated');
    await categoriesPage.goto();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name → error toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    const form = await categoriesPage.openEditForm(TEST_CATEGORIES.edit.updated);
    await form.fill({ name: TEST_CATEGORIES.duplicate.name });
    await form.saveButton.click();

    await expectToast(page, 'A category with this name already exists.');
  });

  // ─── Delete ──────────────────────────────────────────────────────

  test('cancel on confirm dialog → category remains', async ({ adminPage: page }) => {
    await deleteTestCategories();
    await createTestCategory(TEST_CATEGORIES.delete.name);
    await createTestCategory(TEST_CATEGORIES.deleteCancel.name);

    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.clickDeleteOnRow(TEST_CATEGORIES.deleteCancel.name);
    await clickCancel(page);

    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.deleteCancel.name)).toBeVisible();
  });

  test('deletes category after confirm → disappears + shows toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.clickDeleteOnRow(TEST_CATEGORIES.delete.name);
    await clickConfirm(page);

    await expectToast(page, 'Category deleted successfully');
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.delete.name)).toHaveCount(0);
  });

  // ─── Search ──────────────────────────────────────────────────────

  test('search filters categories by name', async ({ adminPage: page }) => {
    await deleteTestCategories();
    await createTestCategory(TEST_CATEGORIES.search.name);
    await createTestCategory(TEST_CATEGORIES.searchOther.name);

    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.search('cat-search');

    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.search.name)).toBeVisible();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.searchOther.name)).toHaveCount(0);
  });

  test('clear search shows all categories', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.search('cat-search');
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.searchOther.name)).toHaveCount(0);

    await categoriesPage.clearSearch();

    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.search.name)).toBeVisible();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.searchOther.name)).toBeVisible();
  });

  // ─── Access Control ──────────────────────────────────────────────

  test('non-admin redirected away from /categories', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    await page.goto('/categories');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('non-admin does not see Categories in sidebar', async ({ authenticatedPage: page }) => {
    await page.goto('/');
    await page.waitForURL('/');

    const categoriesLink = page.locator('a', { hasText: 'Categories' });
    await expect(categoriesLink).not.toBeVisible();
  });
});
