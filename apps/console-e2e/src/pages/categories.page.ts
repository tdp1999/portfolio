import { type Locator, type Page } from '@playwright/test';

export class CategoriesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Category Management' });
    this.createButton = page.getByRole('button', { name: 'Create Category' });
    this.searchInput = page.getByRole('textbox', { name: 'Search categories' });
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
  }

  async goto(): Promise<void> {
    await this.page.goto('/categories');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByName(name: string): Locator {
    return this.page.locator('tr', { has: this.page.getByRole('cell', { name, exact: true }) });
  }

  async createCategory(name: string, opts?: { description?: string; displayOrder?: number }): Promise<void> {
    await this.createButton.click();
    const dialog = this.page.locator('mat-dialog-container');
    await dialog.locator('input[formControlName="name"]').fill(name);
    if (opts?.description) {
      await dialog.locator('textarea[formControlName="description"]').fill(opts.description);
    }
    if (opts?.displayOrder !== undefined) {
      const orderInput = dialog.locator('input[formControlName="displayOrder"]');
      await orderInput.clear();
      await orderInput.fill(String(opts.displayOrder));
    }
    await dialog.getByRole('button', { name: 'Create' }).click();
  }

  async editCategory(
    currentName: string,
    updates: { name?: string; description?: string; displayOrder?: number }
  ): Promise<void> {
    const row = this.getRowByName(currentName);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'edit' }) }).click();
    const dialog = this.page.locator('mat-dialog-container');

    if (updates.name !== undefined) {
      const input = dialog.locator('input[formControlName="name"]');
      await input.clear();
      await input.fill(updates.name);
    }
    if (updates.description !== undefined) {
      const textarea = dialog.locator('textarea[formControlName="description"]');
      await textarea.clear();
      await textarea.fill(updates.description);
    }
    if (updates.displayOrder !== undefined) {
      const orderInput = dialog.locator('input[formControlName="displayOrder"]');
      await orderInput.clear();
      await orderInput.fill(String(updates.displayOrder));
    }
    await dialog.getByRole('button', { name: 'Update' }).click();
  }

  async clickDeleteOnRow(name: string): Promise<void> {
    const row = this.getRowByName(name);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'delete' }) }).click();
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

  get dialog() {
    return {
      container: this.page.locator('mat-dialog-container'),
      nameInput: this.page.locator('mat-dialog-container input[formControlName="name"]'),
      descriptionInput: this.page.locator('mat-dialog-container textarea[formControlName="description"]'),
      displayOrderInput: this.page.locator('mat-dialog-container input[formControlName="displayOrder"]'),
      cancelButton: this.page.locator('mat-dialog-container button', { hasText: 'Cancel' }),
      serverError: this.page.locator('mat-dialog-container .text-red-500'),
    };
  }
}
