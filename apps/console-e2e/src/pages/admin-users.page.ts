import { type Locator, type Page } from '@playwright/test';

export class AdminUsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly inviteButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly noDataMessage: Locator;
  readonly spinnerOverlay: Locator;

  // Invite dialog
  readonly dialogTitle: Locator;
  readonly dialogNameInput: Locator;
  readonly dialogEmailInput: Locator;
  readonly dialogSubmitButton: Locator;
  readonly dialogCancelButton: Locator;
  readonly dialogServerError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'User Management' });
    this.inviteButton = page.locator('button', { hasText: 'Invite User' });
    this.searchInput = page.locator('console-filter-search input');
    this.statusFilter = page.locator('console-filter-select');
    this.table = page.locator('table.mat-mdc-table');
    this.paginator = page.locator('mat-paginator');
    this.noDataMessage = page.getByText('No users found');
    this.spinnerOverlay = page.locator('console-spinner-overlay');

    // Dialog locators (visible only when dialog is open)
    this.dialogTitle = page.locator('h2[mat-dialog-title]', { hasText: 'Invite User' });
    this.dialogNameInput = page.locator('mat-dialog-content input[formControlName="name"]');
    this.dialogEmailInput = page.locator('mat-dialog-content input[formControlName="email"]');
    this.dialogSubmitButton = page.locator('mat-dialog-actions button', { hasText: 'Invite' });
    this.dialogCancelButton = page.locator('mat-dialog-actions button', { hasText: 'Cancel' });
    this.dialogServerError = page.locator('mat-dialog-content .text-red-500');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/users');
  }

  async inviteUser(name: string, email: string): Promise<void> {
    await this.inviteButton.click();
    await this.dialogTitle.waitFor();
    await this.dialogNameInput.fill(name);
    await this.dialogEmailInput.fill(email);
    await this.dialogSubmitButton.click();
  }

  async getRowByEmail(email: string): Promise<Locator> {
    return this.table.locator('tr', { hasText: email });
  }

  async getDeleteButton(email: string): Promise<Locator> {
    const row = this.table.locator('tr', { hasText: email });
    return row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'delete' }) });
  }

  async deleteUser(email: string): Promise<void> {
    const deleteBtn = await this.getDeleteButton(email);
    await deleteBtn.click();
    // Confirm in the confirmation dialog
    await this.page.locator('mat-dialog-actions button', { hasText: 'Delete' }).click();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
  }
}
