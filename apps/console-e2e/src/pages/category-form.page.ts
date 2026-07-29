import { type Locator, type Page } from '@playwright/test';
import { StickyFormPage } from './section-form.page';

/**
 * The routed category form at `/categories/new` and `/categories/:id/edit`.
 *
 * Two `console-section-card`s (Identity, Settings) but **no** `console-section-tabs` — both
 * bodies are always on screen, so unlike the skill/project/experience forms there is nothing to
 * activate before touching Display Order.
 */
export class CategoryFormPage extends StickyFormPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly displayOrderInput: Locator;
  readonly nameError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^(New|Edit) Category$/ });
    this.nameInput = page.locator('input[formControlName="name"]');
    this.descriptionInput = page.locator('textarea[formControlName="description"]');
    this.displayOrderInput = page.locator('input[formControlName="displayOrder"]');
    this.nameError = this.errorFor('name');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/categories/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/categories/${id}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Fill only what is passed; `displayOrder` is pre-seeded, so it is cleared first. */
  async fill(values: { name?: string; description?: string; displayOrder?: number }): Promise<void> {
    if (values.name !== undefined) await this.nameInput.fill(values.name);
    if (values.description !== undefined) await this.descriptionInput.fill(values.description);
    if (values.displayOrder !== undefined) {
      await this.displayOrderInput.clear();
      await this.displayOrderInput.fill(String(values.displayOrder));
    }
  }

  /** Click Save changes and wait for the write to land on `/api/categories`. */
  async save(method: 'POST' | 'PATCH' = 'POST'): Promise<number> {
    return this.saveAndWait('/api/categories', method);
  }
}
