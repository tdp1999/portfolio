import { type Locator, type Page } from '@playwright/test';
import { StickyFormPage } from './section-form.page';

/**
 * The routed tag form at `/tags/new` and `/tags/:id/edit`.
 *
 * There is one `console-section-card` and no `console-section-tabs`, so nothing is `[hidden]`
 * and there is no rail to click — hence `StickyFormPage`, not `SectionFormPage`.
 */
export class TagFormPage extends StickyFormPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly nameError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^(New|Edit) Tag$/ });
    this.nameInput = page.locator('input[formControlName="name"]');
    this.nameError = this.errorFor('name');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/tags/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(id: string): Promise<void> {
    await this.page.goto(`/tags/${id}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Type a name and blur, so Material's error-state matcher lets `<mat-error>` render. */
  async fillName(value: string): Promise<void> {
    await this.nameInput.fill(value);
    await this.nameInput.blur();
  }

  /** Click Save changes and wait for the write to land on `/api/tags`. */
  async save(method: 'POST' | 'PATCH' = 'POST'): Promise<number> {
    return this.saveAndWait('/api/tags', method);
  }
}
