import { test, expect } from './fixtures/auth.fixture';
import { CategoriesPage } from './pages/categories.page';
import { TEST_CATEGORIES } from './data/test-categories';
import { createTestCategory, deleteTestCategories } from './helpers/db-categories';
import { expectToast } from './helpers/toast';
import { clickConfirm, clickCancel } from './helpers/dialog';

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

  // ─── Create ──────────────────────────────────────────────────────

  test('creates category with all fields → appears in table + shows toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createCategory(TEST_CATEGORIES.create.name, {
      description: TEST_CATEGORIES.create.description,
      displayOrder: TEST_CATEGORIES.create.displayOrder,
    });

    await expectToast(page, 'Category created successfully');
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.create.name)).toBeVisible();
  });

  test('dialog cancel → no category created', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createButton.click();
    await categoriesPage.dialog.nameInput.fill(TEST_CATEGORIES.createCancel.name);
    await categoriesPage.dialog.cancelButton.click();

    await expect(categoriesPage.dialog.container).not.toBeVisible();
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.createCancel.name)).not.toBeVisible();
  });

  test('create validation: empty name', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createButton.click();
    const createBtn = categoriesPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(categoriesPage.dialog.container.getByText('Name is required')).toBeVisible();
    await categoriesPage.dialog.cancelButton.click();
  });

  test('create validation: name > 100 chars', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.createButton.click();
    await categoriesPage.dialog.nameInput.fill('a'.repeat(101));
    const createBtn = categoriesPage.dialog.container.getByRole('button', { name: 'Create' });
    await createBtn.click();

    await expect(categoriesPage.dialog.container.getByText('Name must be 100 characters or less')).toBeVisible();
    await categoriesPage.dialog.cancelButton.click();
  });

  test('create server error: duplicate name', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await createTestCategory(TEST_CATEGORIES.duplicate.name);

    await categoriesPage.createCategory(TEST_CATEGORIES.duplicate.name);

    await expect(categoriesPage.dialog.serverError).toBeVisible();
    await categoriesPage.dialog.cancelButton.click();
  });

  // ─── Edit ────────────────────────────────────────────────────────

  test('edit dialog pre-filled with current values', async ({ adminPage: page }) => {
    await deleteTestCategories();
    await createTestCategory(TEST_CATEGORIES.edit.name, {
      description: TEST_CATEGORIES.edit.description,
      displayOrder: TEST_CATEGORIES.edit.displayOrder,
    });
    await createTestCategory(TEST_CATEGORIES.duplicate.name);

    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    const row = categoriesPage.getRowByName(TEST_CATEGORIES.edit.name);
    await row.locator('button', { has: page.locator('mat-icon', { hasText: 'edit' }) }).click();

    await expect(categoriesPage.dialog.nameInput).toHaveValue(TEST_CATEGORIES.edit.name);
    await expect(categoriesPage.dialog.descriptionInput).toHaveValue(TEST_CATEGORIES.edit.description);
    await expect(categoriesPage.dialog.displayOrderInput).toHaveValue(String(TEST_CATEGORIES.edit.displayOrder));
    await categoriesPage.dialog.cancelButton.click();
  });

  test('edits category → updated in table + shows toast', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.editCategory(TEST_CATEGORIES.edit.name, {
      name: TEST_CATEGORIES.edit.updated,
      description: TEST_CATEGORIES.edit.updatedDescription,
      displayOrder: TEST_CATEGORIES.edit.updatedDisplayOrder,
    });

    await expectToast(page, 'Category updated successfully');
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.edit.updated)).toBeVisible();
  });

  test('edit server error: duplicate name', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.editCategory(TEST_CATEGORIES.edit.updated, {
      name: TEST_CATEGORIES.duplicate.name,
    });

    await expect(categoriesPage.dialog.serverError).toBeVisible();
    await categoriesPage.dialog.cancelButton.click();
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
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.delete.name)).not.toBeVisible();
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
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.searchOther.name)).not.toBeVisible();
  });

  test('clear search shows all categories', async ({ adminPage: page }) => {
    const categoriesPage = new CategoriesPage(page);
    await categoriesPage.goto();

    await categoriesPage.search('cat-search');
    await expect(categoriesPage.getRowByName(TEST_CATEGORIES.searchOther.name)).not.toBeVisible();

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
