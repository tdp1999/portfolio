import { type Locator, type Page } from '@playwright/test';

export class TagsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Tag Management' });
    this.createButton = page.getByRole('button', { name: 'Create Tag' });
    this.searchInput = page.getByRole('textbox', { name: 'Search tags' });
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
  }

  async goto(): Promise<void> {
    await this.page.goto('/tags');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByName(name: string): Locator {
    return this.page.locator('tr', { has: this.page.locator('td', { hasText: name }) });
  }

  /** Opens the create dialog, fills name, and submits. */
  async createTag(name: string): Promise<void> {
    await this.createButton.click();
    const dialog = this.page.locator('mat-dialog-container');
    await dialog.locator('input[formControlName="name"]').fill(name);
    await dialog.getByRole('button', { name: 'Create' }).click();
  }

  /** Clicks the edit button on the row, updates the name, and submits. */
  async editTag(currentName: string, newName: string): Promise<void> {
    const row = this.getRowByName(currentName);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'edit' }) }).click();
    const dialog = this.page.locator('mat-dialog-container');
    const input = dialog.locator('input[formControlName="name"]');
    await input.clear();
    await input.fill(newName);
    await dialog.getByRole('button', { name: 'Update' }).click();
  }

  /** Clicks the delete button on the row (opens confirm dialog). */
  async clickDeleteOnRow(name: string): Promise<void> {
    const row = this.getRowByName(name);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'delete' }) }).click();
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/tags') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/tags') && r.status() === 200);
    await this.searchInput.clear();
    await responsePromise;
  }

  get dialog() {
    return {
      container: this.page.locator('mat-dialog-container'),
      nameInput: this.page.locator('mat-dialog-container input[formControlName="name"]'),
      cancelButton: this.page.locator('mat-dialog-container button', { hasText: 'Cancel' }),
      serverError: this.page.locator('mat-dialog-container .text-red-500'),
    };
  }
}
