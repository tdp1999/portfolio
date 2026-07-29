import { expect, type Locator, type Page } from '@playwright/test';
import { PostFormPage } from './post-form.page';

/**
 * `/admin/blog` — the blog post list.
 *
 * Like `/projects`, the All / Trash tabs are gone: filtering is a `console-filter-select`
 * labelled "Status" plus a "Show deleted" `mat-chip-option`, and a soft-deleted post is
 * *absent* from the table until that chip is on. Row actions are icon buttons with
 * `aria-label`s — Edit is an `<a routerLink>`, so it is a link by role, not a button.
 *
 * The status cell renders the human label from `BLOG_POST_STATUS_LABELS` — "Draft", not the
 * raw `DRAFT` enum value the old spec looked for.
 */
export class PostsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newPostLink: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly showDeletedChip: Locator;
  readonly table: Locator;
  readonly paginator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Blog Posts', level: 1 });
    this.newPostLink = page.getByRole('link', { name: 'New Post' });
    this.searchInput = page.locator('console-filter-search input');
    this.statusFilter = page.locator('console-filter-select mat-select');
    this.showDeletedChip = page.getByRole('option', { name: 'Show deleted' });
    this.table = page.getByRole('table');
    this.paginator = page.locator('mat-paginator');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/blog');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  getRow(title: string): Locator {
    return this.table.getByRole('row').filter({ hasText: title });
  }

  /** The status badge cell — "Draft" / "Published" / "Deleted". */
  statusBadge(title: string): Locator {
    return this.getRow(title).getByRole('cell').nth(2);
  }

  restoreButton(title: string): Locator {
    return this.getRow(title).getByRole('button', { name: 'Restore', exact: true });
  }

  /** Soft-deleted posts are fetched only when this chip is on. */
  async showDeleted(enabled = true): Promise<void> {
    // Check first, *then* build the promise — see the note in `projects.page.ts`. An unawaited
    // `waitForResponse` on the no-op branch surfaces as an unhandled rejection 30s later.
    const isOn = (await this.showDeletedChip.getAttribute('aria-selected')) === 'true';
    if (isOn === enabled) return;

    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/admin/blog') && r.status() === 200);
    await this.showDeletedChip.click();
    await responsePromise;
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/admin/blog') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  // ── Navigation into the routed editor ───────────────────────────────

  async openNewPostForm(): Promise<PostFormPage> {
    await this.newPostLink.click();
    const form = new PostFormPage(this.page);
    await form.titleInput.waitFor({ state: 'visible', timeout: 10_000 });
    return form;
  }

  async openEditForm(title: string): Promise<PostFormPage> {
    await this.getRow(title).getByRole('link', { name: 'Edit', exact: true }).click();
    const form = new PostFormPage(this.page);
    await form.titleInput.waitFor({ state: 'visible', timeout: 10_000 });
    // The editor fetches the post before patching itself; filling first gets overwritten.
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
