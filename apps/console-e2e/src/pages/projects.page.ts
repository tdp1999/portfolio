import { expect, type Page, type Locator } from '@playwright/test';
import { ProjectFormPage } from './project-form.page';

/**
 * `/projects` — the list page.
 *
 * Three things the old POM assumed are gone:
 *
 * - the `<h1>` reads **"Project Management"**, not "Projects";
 * - there are **no tabs**. All / Published / Draft / Trash were replaced by a
 *   `console-filter-select` labelled "Status" plus a "Show deleted" `mat-chip-option`, so
 *   `getByRole('tab', …)` matches nothing;
 * - row actions are icon buttons with `aria-label`s, not entries behind an "Actions" menu.
 *
 * `ProjectDialog` is gone with them: create and edit are routed pages — use `ProjectFormPage`.
 */
export class ProjectsPage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly showDeletedChip: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly noDataRow: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Project Management', level: 1 });
    this.createButton = page.getByRole('button', { name: 'Create Project' });
    this.searchInput = page.locator('console-filter-search input');
    this.statusFilter = page.locator('console-filter-select mat-select');
    this.showDeletedChip = page.getByRole('option', { name: 'Show deleted' });
    this.table = page.getByRole('table');
    this.paginator = page.locator('mat-paginator');
    this.noDataRow = page.getByText('No projects found');
  }

  async goto(): Promise<void> {
    await this.page.goto('/projects');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  getRow(title: string): Locator {
    return this.table.getByRole('row').filter({ hasText: title });
  }

  statusBadge(title: string): Locator {
    return this.getRow(title).getByRole('cell').nth(2);
  }

  restoreButton(title: string): Locator {
    return this.getRow(title).getByRole('button', { name: 'Restore', exact: true });
  }

  /**
   * Soft-deleted projects are hidden until this is on — the list requests `includeDeleted`
   * only when the chip is selected, so a deleted row is absent from the table, not merely dim.
   */
  async showDeleted(enabled = true): Promise<void> {
    // Check first, *then* build the promise. Constructing it up front leaves an unawaited
    // `waitForResponse` behind on the no-op branch, which rejects on its 30s timeout as an
    // unhandled rejection long after this call returned.
    const isOn = (await this.showDeletedChip.getAttribute('aria-selected')) === 'true';
    if (isOn === enabled) return;

    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/projects') && r.status() === 200);
    await this.showDeletedChip.click();
    await responsePromise;
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/projects') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  // ── Navigation into the routed form ─────────────────────────────────

  async openCreateForm(): Promise<ProjectFormPage> {
    await this.createButton.click();
    const form = new ProjectFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  async openEditForm(title: string): Promise<ProjectFormPage> {
    await this.getRow(title).getByRole('button', { name: 'Edit', exact: true }).click();
    const form = new ProjectFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    // The form fetches the project before patching itself; filling first gets overwritten.
    await expect(form.titleInput).not.toHaveValue('');
    return form;
  }

  async clickDelete(title: string): Promise<void> {
    await this.getRow(title).getByRole('button', { name: 'Delete', exact: true }).click();
  }

  async clickRestore(title: string): Promise<void> {
    await this.restoreButton(title).click();
  }
}
