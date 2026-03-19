import { type Locator, type Page } from '@playwright/test';

export class SkillsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Skill Management' });
    this.createButton = page.getByRole('button', { name: 'Create Skill' });
    this.searchInput = page.getByRole('textbox', { name: 'Search skills' });
    this.categoryFilter = page.locator('console-filter-select');
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
  }

  async goto(): Promise<void> {
    await this.page.goto('/skills');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByName(name: string): Locator {
    return this.page.locator('tr', { has: this.page.getByRole('cell', { name, exact: true }) });
  }

  async createSkill(
    name: string,
    category: string,
    opts?: {
      description?: string;
      displayOrder?: number;
      parentSkillName?: string;
      isLibrary?: boolean;
      isFeatured?: boolean;
    }
  ): Promise<void> {
    await this.createButton.click();
    const dialog = this.page.locator('mat-dialog-container');
    await dialog.locator('input[formControlName="name"]').fill(name);

    // Select category
    await dialog.locator('mat-select[formControlName="category"]').click();
    await this.page.locator('mat-option', { hasText: this.categoryLabel(category) }).click();

    if (opts?.description) {
      await dialog.locator('textarea[formControlName="description"]').fill(opts.description);
    }
    if (opts?.parentSkillName) {
      await dialog.locator('mat-select[formControlName="parentSkillId"]').click();
      await this.page.locator('mat-option', { hasText: opts.parentSkillName }).click();
    }
    if (opts?.isLibrary) {
      await dialog.locator('mat-checkbox[formControlName="isLibrary"]').click();
    }
    if (opts?.isFeatured) {
      await dialog.locator('mat-checkbox[formControlName="isFeatured"]').click();
    }
    if (opts?.displayOrder !== undefined) {
      const orderInput = dialog.locator('input[formControlName="displayOrder"]');
      await orderInput.clear();
      await orderInput.fill(String(opts.displayOrder));
    }
    await dialog.getByRole('button', { name: 'Create' }).click();
  }

  async editSkill(
    currentName: string,
    updates: {
      name?: string;
      category?: string;
      description?: string;
      displayOrder?: number;
      parentSkillName?: string | null;
    }
  ): Promise<void> {
    const row = this.getRowByName(currentName);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'edit' }) }).click();
    const dialog = this.page.locator('mat-dialog-container');

    if (updates.name !== undefined) {
      const input = dialog.locator('input[formControlName="name"]');
      await input.clear();
      await input.fill(updates.name);
    }
    if (updates.category !== undefined) {
      await dialog.locator('mat-select[formControlName="category"]').click();
      await this.page.locator('mat-option', { hasText: this.categoryLabel(updates.category) }).click();
    }
    if (updates.description !== undefined) {
      const textarea = dialog.locator('textarea[formControlName="description"]');
      await textarea.clear();
      await textarea.fill(updates.description);
    }
    if (updates.parentSkillName !== undefined) {
      await dialog.locator('mat-select[formControlName="parentSkillId"]').click();
      if (updates.parentSkillName === null) {
        await this.page.locator('mat-option', { hasText: 'None' }).click();
      } else {
        await this.page.locator('mat-option', { hasText: updates.parentSkillName }).click();
      }
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
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/skills') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/skills') && r.status() === 200);
    await this.searchInput.clear();
    await responsePromise;
  }

  async filterByCategory(category: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/skills') && r.status() === 200);
    await this.categoryFilter.locator('mat-select').click();
    await this.page.locator('mat-option', { hasText: category === '' ? 'All' : this.categoryLabel(category) }).click();
    await responsePromise;
  }

  get dialog() {
    return {
      container: this.page.locator('mat-dialog-container'),
      nameInput: this.page.locator('mat-dialog-container input[formControlName="name"]'),
      categorySelect: this.page.locator('mat-dialog-container mat-select[formControlName="category"]'),
      descriptionInput: this.page.locator('mat-dialog-container textarea[formControlName="description"]'),
      parentSkillSelect: this.page.locator('mat-dialog-container mat-select[formControlName="parentSkillId"]'),
      displayOrderInput: this.page.locator('mat-dialog-container input[formControlName="displayOrder"]'),
      cancelButton: this.page.locator('mat-dialog-container button', { hasText: 'Cancel' }),
      serverError: this.page.locator('mat-dialog-container .text-red-500'),
    };
  }

  private categoryLabel(category: string): string {
    const map: Record<string, string> = {
      TECHNICAL: 'Technical',
      TOOLS: 'Tools',
      ADDITIONAL: 'Additional',
    };
    return map[category] ?? category;
  }
}
