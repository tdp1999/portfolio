import { expect, type Locator, type Page } from '@playwright/test';
import { ExperienceFormPage } from './experience-form.page';

/**
 * `/experiences` — the list page.
 *
 * The create/edit flow is routed, not modal. The handlers on the list component are still
 * named `openCreateDialog()` / `openEditDialog()`, but both call `router.navigate`. The only
 * `mat-dialog-container` left here is the delete/restore confirmation.
 *
 * Row actions are icon buttons with `aria-label`s ("Edit", "Delete", "Restore"), not entries in
 * a `mat-menu` — there is no overflow menu to open first. A soft-deleted row is marked by
 * `opacity-50` plus its Edit/Delete pair being replaced by Restore; the "Deleted" badge that
 * older specs looked for lives on the *detail* page, never in this table.
 */
export class ExperiencesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly showDeletedChip: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Experience Management' });
    // A real `<button>` here, unlike the tag/category pages where it is an `<a routerLink>`.
    this.addButton = page.getByRole('button', { name: 'Add Experience' });
    this.searchInput = page.locator('console-filter-search input');
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.showDeletedChip = page.getByRole('option', { name: 'Show deleted' });
    this.emptyState = page.getByText('No experiences found');
  }

  async goto(): Promise<void> {
    await this.page.goto('/experiences');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Matched on the company link in the identity cell, exactly. */
  getRowByCompany(companyName: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(companyName, { exact: true }) });
  }

  /** True while the row is soft-deleted — the list marks that state with `opacity-50` only. */
  isRowDeleted(companyName: string): Promise<boolean> {
    return this.getRowByCompany(companyName).evaluate((el) => el.classList.contains('opacity-50'));
  }

  /**
   * Toggle the "Show deleted" chip and wait for the refetched list.
   *
   * Needed to see a soft-deleted experience at all. `showDeleted` starts `false` and the query then
   * omits `includeDeleted`, so a deleted row is **absent** from the table rather than dimmed — the
   * `opacity-50` + Restore rendering only exists once deleted rows are included. Same shape as the
   * projects and blog lists.
   */
  async showDeleted(enabled = true): Promise<void> {
    const isOn = (await this.showDeletedChip.getAttribute('aria-selected')) === 'true';
    if (isOn === enabled) return;

    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/experiences') && r.status() === 200
    );
    await this.showDeletedChip.click();
    await responsePromise;
  }

  restoreButton(companyName: string): Locator {
    return this.getRowByCompany(companyName).getByRole('button', { name: 'Restore', exact: true });
  }

  // ── Navigation into the routed form ─────────────────────────────────

  async openCreateForm(): Promise<ExperienceFormPage> {
    await this.addButton.click();
    const form = new ExperienceFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  async openEditForm(companyName: string): Promise<ExperienceFormPage> {
    await this.getRowByCompany(companyName).getByRole('button', { name: 'Edit', exact: true }).click();
    const form = new ExperienceFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    // Edit forks a `forkJoin(skills, experience)` before patching the form; filling before
    // that resolves would be silently overwritten.
    await form.activate('section-company');
    await expect(form.companyNameInput).not.toHaveValue('');
    return form;
  }

  async clickDelete(companyName: string): Promise<void> {
    await this.getRowByCompany(companyName).getByRole('button', { name: 'Delete', exact: true }).click();
  }

  async clickRestore(companyName: string): Promise<void> {
    await this.restoreButton(companyName).click();
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/experiences') && r.status() === 200
    );
    await this.searchInput.fill(query);
    await responsePromise;
  }
}
