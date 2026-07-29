import { expect, type Locator, type Page } from '@playwright/test';
import { TagFormPage } from './tag-form.page';

/**
 * `/tags` — the list page.
 *
 * Create and edit are **routes** (`/tags/new`, `/tags/:id/edit`), not dialogs. "Create Tag" is an
 * `<a routerLink="./new">` and the row Edit control is an `<a>` too, so both are links by role,
 * not buttons. The only `mat-dialog-container` left on this page is the delete confirmation.
 */
export class TagsPage {
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
    this.heading = page.getByRole('heading', { name: 'Tag Management' });
    this.createLink = page.getByRole('link', { name: 'Create Tag' });
    // `console-filter-search` never sets `label`, so the accessible name is the default
    // "Search" — not the placeholder "Search tags...". Target the input structurally.
    this.searchInput = page.locator('console-filter-search input');
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.showDeletedChip = page.getByRole('option', { name: 'Show deleted' });
    this.emptyState = page.getByText('No tags found');
  }

  async goto(): Promise<void> {
    await this.page.goto('/tags');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * A row, matched on the name cell's link.
   *
   * Exact matching matters: `hasText` is a substring test, so a row filter for `e2e-edit-tag`
   * would also match the `e2e-edited-tag` row and trip strict mode once both exist.
   *
   * The same trap bites the row's *action* locators from the other direction, which is why
   * every one of them below passes `exact: true`. Accessible-name matching is substring and
   * case-insensitive, and the row contains the record's own name — so a plain
   * `getByRole('link', { name: 'Edit' })` inside the `e2e-edit-tag` row matched both the
   * `aria-label="Edit"` icon button *and* the name link itself. Every list POM had this.
   */
  getRowByName(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  // ── Navigation into the routed form ─────────────────────────────────

  async openCreateForm(): Promise<TagFormPage> {
    await this.createLink.click();
    const form = new TagFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  async openEditForm(name: string): Promise<TagFormPage> {
    await this.getRowByName(name).getByRole('link', { name: 'Edit', exact: true }).click();
    const form = new TagFormPage(this.page);
    await form.heading.waitFor({ state: 'visible', timeout: 10_000 });
    // The form fetches the tag before it can be filled. Without this, a `fill()` that lands
    // first is silently overwritten by `setValue` when the GET resolves.
    await expect(form.nameInput).not.toHaveValue('');
    return form;
  }

  /** Create through the UI and wait for the POST to land. */
  async createTag(name: string): Promise<void> {
    const form = await this.openCreateForm();
    await form.fillName(name);
    await form.save('POST');
  }

  /** Edit through the UI and wait for the PATCH to land. */
  async editTag(currentName: string, newName: string): Promise<void> {
    const form = await this.openEditForm(currentName);
    await form.fillName(newName);
    await form.save('PATCH');
  }

  /** Opens the delete confirmation dialog — that one really is a `mat-dialog-container`. */
  async clickDeleteOnRow(name: string): Promise<void> {
    await this.getRowByName(name).getByRole('button', { name: 'Delete', exact: true }).click();
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
}
