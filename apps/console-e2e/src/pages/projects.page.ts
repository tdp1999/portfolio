import { type Page, type Locator } from '@playwright/test';

export class ProjectsPage {
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly table: Locator;
  readonly noDataRow: Locator;
  readonly tabs: {
    all: Locator;
    published: Locator;
    draft: Locator;
    trash: Locator;
  };

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Projects', level: 1 });
    this.createButton = page.getByRole('button', { name: 'Create Project' });
    this.table = page.getByRole('table');
    this.noDataRow = page.getByText('No projects found');
    this.tabs = {
      all: page.getByRole('tab', { name: 'All' }),
      published: page.getByRole('tab', { name: 'Published' }),
      draft: page.getByRole('tab', { name: 'Draft' }),
      trash: page.getByRole('tab', { name: 'Trash' }),
    };
  }

  async goto(): Promise<void> {
    await this.page.goto('/projects');
    await this.page.waitForURL('**/projects');
  }

  getRow(title: string): Locator {
    return this.table.getByRole('row').filter({ hasText: title });
  }

  async openActionsMenu(title: string): Promise<void> {
    await this.getRow(title).getByRole('button', { name: 'Actions' }).click();
  }

  async clickEdit(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'Edit' }).click();
  }

  async clickDelete(): Promise<void> {
    await this.page.getByRole('menuitem', { name: 'Delete' }).click();
  }

  async clickRestore(title: string): Promise<void> {
    await this.getRow(title).getByRole('button', { name: 'Restore' }).click();
  }
}

export class ProjectDialog {
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly startDateInput: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog');
    this.titleInput = this.dialog.getByRole('textbox', { name: 'Title' });
    this.startDateInput = this.dialog.getByRole('textbox', { name: 'Start Date' });
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.updateButton = this.dialog.getByRole('button', { name: 'Update' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.clear();
    await this.titleInput.fill(title);
  }

  async fillStartDate(date: string): Promise<void> {
    await this.startDateInput.clear();
    await this.startDateInput.fill(date);
  }
}
