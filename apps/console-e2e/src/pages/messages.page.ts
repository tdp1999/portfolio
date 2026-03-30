import { type Locator, type Page } from '@playwright/test';

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
    this.heading = page.getByRole('heading', { name: 'Messages' });
    this.searchInput = page.getByRole('textbox', { name: 'Search', exact: true });
    this.statusSelect = page.locator('console-filter-select').first();
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.selectAllCheckbox = page.locator('th.col-select mat-checkbox');
    this.bulkToolbar = page.locator('.bulk-toolbar');
    this.noDataRow = page.locator('text=No messages yet');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForURL('/', { timeout: 10000 });
    await this.page.goto('/messages');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByName(name: string): Locator {
    return this.page.locator('tr', { has: this.page.locator('td', { hasText: name }) });
  }

  async clickMessage(name: string): Promise<void> {
    const row = this.getRowByName(name);
    await row.locator('td.cursor-pointer').first().click();
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
    const row = this.getRowByName(name);
    await row.locator('mat-checkbox').click();
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

export class MessageDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly markUnreadButton: Locator;
  readonly replyButton: Locator;
  readonly archiveButton: Locator;
  readonly deleteButton: Locator;
  readonly restoreButton: Locator;
  readonly messageBody: Locator;
  readonly metaFrom: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Message Detail' });
    this.backButton = page.locator('button', { has: page.locator('mat-icon', { hasText: 'arrow_back' }) });
    this.markUnreadButton = page.getByRole('button', { name: 'Mark Unread' });
    this.replyButton = page.getByRole('button', { name: 'Reply' });
    this.archiveButton = page.getByRole('button', { name: 'Archive' });
    this.deleteButton = page.getByRole('button', { name: 'Delete' });
    this.restoreButton = page.getByRole('button', { name: 'Restore' });
    this.messageBody = page.locator('.message-body');
    this.metaFrom = page
      .locator('.meta-row')
      .filter({ has: page.locator('.meta-label', { hasText: /^From$/ }) })
      .locator('.meta-value');
  }

  async waitForLoad(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }
}
