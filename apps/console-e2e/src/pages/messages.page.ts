import { type Locator, type Page } from '@playwright/test';

/** `/messages` — the contact-message inbox. */
export class MessagesPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly statusSelect: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly selectAllCheckbox: Locator;
  readonly bulkToolbar: Locator;
  readonly noDataRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Messages', level: 1 });
    // `console-filter-search` leaves `label` at its default, so the accessible name is
    // "Search", not the placeholder "Search messages...". Target the input structurally.
    this.searchInput = page.locator('console-filter-search input');
    this.statusSelect = page.locator('console-filter-select mat-select').first();
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.selectAllCheckbox = page.locator('th.col-select mat-checkbox');
    this.bulkToolbar = page.locator('.bulk-toolbar');
    this.noDataRow = page.getByText('No messages yet');
  }

  async goto(): Promise<void> {
    await this.page.goto('/messages');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Matched on the sender-name cell. Exact, so `inbox-1` cannot also match `inbox-10`. */
  getRowByName(name: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** Only the sender and subject cells navigate — the checkbox cell deliberately does not. */
  async clickMessage(name: string): Promise<void> {
    await this.getRowByName(name).locator('td.cursor-pointer').first().click();
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/contact-messages') && r.status() === 200
    );
    await this.searchInput.fill(query);
    await responsePromise;
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/contact-messages') && r.status() === 200
    );
    await this.searchInput.clear();
    await responsePromise;
  }

  async toggleSelectMessage(name: string): Promise<void> {
    await this.getRowByName(name).locator('td.col-select mat-checkbox').click();
  }

  async bulkMarkAsRead(): Promise<void> {
    await this.bulkToolbar.getByRole('button', { name: 'Mark as Read' }).click();
  }

  async bulkArchive(): Promise<void> {
    await this.bulkToolbar.getByRole('button', { name: 'Archive' }).click();
  }

  async bulkDelete(): Promise<void> {
    await this.bulkToolbar.getByRole('button', { name: 'Delete' }).click();
  }
}

/**
 * `/messages/:id` — the message detail view.
 *
 * Two shape changes from the version older specs assumed:
 *
 * - the `<h1>` is the **sender's name**, not a fixed "Message Detail" title, so there is no
 *   constant string to wait on — `waitForLoad(name)` takes the name it should show;
 * - Mark Unread / Archive / Delete live inside a `mat-menu` behind an icon button labelled
 *   "More actions". Only Reply is a top-level control, so clicking Archive means opening the
 *   overflow first. `Restore` is in the same menu and only renders for a deleted message.
 *
 * The meta rows are Email / Subject / Purpose / Locale — there is no "From" row; that
 * information is the heading.
 */
export class MessageDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backLink: Locator;
  readonly replyButton: Locator;
  readonly moreActionsButton: Locator;
  readonly menu: Locator;
  readonly markUnreadItem: Locator;
  readonly archiveItem: Locator;
  readonly deleteItem: Locator;
  readonly restoreItem: Locator;
  readonly messageBody: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1.text-page-title');
    this.backLink = page.getByRole('link', { name: 'Back to messages' });
    this.replyButton = page.getByRole('button', { name: 'Reply' });
    this.moreActionsButton = page.getByRole('button', { name: 'More actions' });
    this.menu = page.locator('.mat-mdc-menu-panel');
    this.markUnreadItem = this.menu.getByRole('menuitem', { name: 'Mark Unread' });
    this.archiveItem = this.menu.getByRole('menuitem', { name: 'Archive' });
    this.deleteItem = this.menu.getByRole('menuitem', { name: 'Delete' });
    this.restoreItem = this.menu.getByRole('menuitem', { name: 'Restore' });
    this.messageBody = page.locator('.message-body');
  }

  /** Wait for the detail of a specific message — the heading is that message's sender name. */
  async waitForLoad(senderName: string): Promise<void> {
    await this.heading.filter({ hasText: senderName }).waitFor({ state: 'visible', timeout: 10_000 });
  }

  metaValue(label: string): Locator {
    return this.page
      .locator('.meta-row')
      .filter({ has: this.page.locator('.meta-label', { hasText: new RegExp(`^${label}$`) }) })
      .locator('.meta-value');
  }

  async openMoreActions(): Promise<void> {
    await this.moreActionsButton.click();
    await this.menu.waitFor({ state: 'visible', timeout: 5_000 });
  }
}
