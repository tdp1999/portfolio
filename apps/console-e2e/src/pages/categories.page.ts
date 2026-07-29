import { expect, type Locator, type Page } from '@playwright/test';
import { CategoryFormPage } from './category-form.page';

/**
 * `/categories` — the list page. Same shape as `/tags`: create and edit are routes
 * (`/categories/new`, `/categories/:id/edit`), and the only dialog left is delete confirmation.
 */
export class CategoriesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createLink: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly showDeletedChip: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Category Management' });
    this.createLink = page.getByRole('link', { name: 'Create Category' });
    // `console-filter-search` never sets `label`, so the accessible name is the default "Search".
    this.searchInput = page.locator('console-filter-search input');
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.showDeletedChip = page.getByRole('option', { name: 'Show deleted' });
    this.emptyState = page.getByText('No categories found');
  }

  async goto(): Promise<void> {
    await this.page.goto('/categories');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Matched on the name cell's link, exactly — see the note in `TagsPage.getRowByName`. */
  getRowByName(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  // ── Navigation into the routed form ─────────────────────────────────

  async openCreateForm(): Promise<CategoryFormPage> {
    await this.createLink.click();
    const form = new CategoryFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  async openEditForm(name: string): Promise<CategoryFormPage> {
    await this.getRowByName(name).getByRole('link', { name: 'Edit', exact: true }).click();
    const form = new CategoryFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    // The form fetches the category first; filling before that lands gets overwritten.
    await expect(form.nameInput).not.toHaveValue('');
    return form;
  }

  async createCategory(name: string, opts?: { description?: string; displayOrder?: number }): Promise<void> {
    const form = await this.openCreateForm();
    await form.fill({ name, ...opts });
    await form.save('POST');
  }

  async editCategory(
    currentName: string,
    updates: { name?: string; description?: string; displayOrder?: number }
  ): Promise<void> {
    const form = await this.openEditForm(currentName);
    await form.fill(updates);
    await form.save('PATCH');
  }

  /** Opens the delete confirmation dialog — that one really is a `mat-dialog-container`. */
  async clickDeleteOnRow(name: string): Promise<void> {
    await this.getRowByName(name).getByRole('button', { name: 'Delete', exact: true }).click();
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/categories') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/categories') && r.status() === 200);
    await this.searchInput.clear();
    await responsePromise;
  }
}
