import { type Locator, type Page } from '@playwright/test';
import { SkillFormPage } from './skill-form.page';

/**
 * `/skills` — the list page only.
 *
 * Create and edit are routed pages (`/skills/new`, `/skills/:id/edit`), so everything that
 * used to fill a `mat-dialog-container` here now lives in `SkillFormPage`; this object only
 * navigates and hands one back. The list's triggers are `<a mat-flat-button routerLink>`,
 * which Material leaves as plain anchors — `MatButton`'s host binding adds a class and no
 * `role`, so `getByRole('button', …)` never matches them.
 */
export class SkillsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createLink: Locator;
  readonly reorderLink: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Skill Management' });
    this.createLink = page.getByRole('link', { name: 'Create Skill' });
    this.reorderLink = page.getByRole('link', { name: 'Reorder' });
    // `console-filter-search` labels its input "Search" (the component default); the
    // "Search skills..." string is only a placeholder and never the accessible name.
    this.searchInput = page.locator('console-filter-search input');
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

  /** Navigate to the create form and return its page object. */
  async openCreateForm(): Promise<SkillFormPage> {
    await this.createLink.click();
    const form = new SkillFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  /** Navigate to a row's edit form and return its page object. */
  async openEditForm(name: string): Promise<SkillFormPage> {
    await this.getRowByName(name).getByRole('link', { name: 'Edit', exact: true }).click();
    const form = new SkillFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
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
    const form = await this.openCreateForm();

    await form.activate('section-identity');
    await form.nameInput.fill(name);
    if (opts?.description) await form.descriptionInput.fill(opts.description);

    await form.activate('section-classification');
    await form.categorySelect.click();
    await this.page.getByRole('option', { name: this.categoryLabel(category), exact: true }).click();

    if (opts?.parentSkillName) {
      await form.parentSkillSelect.click();
      await this.page.getByRole('option', { name: opts.parentSkillName, exact: true }).click();
    }
    if (opts?.isLibrary) {
      await form.section('section-classification').getByRole('checkbox', { name: 'Library / Framework' }).check();
    }

    if (opts?.isFeatured || opts?.displayOrder !== undefined) {
      await form.activate('section-settings');
      if (opts.isFeatured) {
        await form.section('section-settings').getByRole('checkbox', { name: 'Featured' }).check();
      }
      if (opts.displayOrder !== undefined) {
        await form.section('section-settings').getByLabel('Display Order').fill(String(opts.displayOrder));
      }
    }

    await form.save('POST');
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
    const form = await this.openEditForm(currentName);

    if (updates.name !== undefined || updates.description !== undefined) {
      await form.activate('section-identity');
      if (updates.name !== undefined) await form.nameInput.fill(updates.name);
      if (updates.description !== undefined) await form.descriptionInput.fill(updates.description);
    }

    if (updates.category !== undefined || updates.parentSkillName !== undefined) {
      await form.activate('section-classification');
      if (updates.category !== undefined) {
        await form.categorySelect.click();
        await this.page.getByRole('option', { name: this.categoryLabel(updates.category), exact: true }).click();
      }
      if (updates.parentSkillName !== undefined) {
        await form.parentSkillSelect.click();
        const label = updates.parentSkillName === null ? 'None' : updates.parentSkillName;
        await this.page.getByRole('option', { name: label, exact: true }).click();
      }
    }

    if (updates.displayOrder !== undefined) {
      await form.activate('section-settings');
      await form.section('section-settings').getByLabel('Display Order').fill(String(updates.displayOrder));
    }

    await form.save('PATCH');
  }

  async clickDeleteOnRow(name: string): Promise<void> {
    await this.getRowByName(name).getByRole('button', { name: 'Delete', exact: true }).click();
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
    const label = category === '' ? 'All' : this.categoryLabel(category);
    await this.page.getByRole('option', { name: label, exact: true }).click();
    await responsePromise;
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
