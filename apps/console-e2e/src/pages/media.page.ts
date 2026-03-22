import { type Locator, type Page } from '@playwright/test';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { TEST_PNG_BASE64 } from '../data/test-media';

export class MediaPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly dropzone: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly gridView: Locator;
  readonly listToggle: Locator;
  readonly gridToggle: Locator;
  readonly trashLink: Locator;
  readonly emptyState: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Media Library' });
    this.dropzone = page.locator('[role="button"][aria-label="Upload files"]');
    this.searchInput = page.getByRole('textbox', { name: 'Search media' });
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.gridView = page.locator('.media-grid');
    this.listToggle = page.locator('mat-button-toggle[value="list"]');
    this.gridToggle = page.locator('mat-button-toggle[value="grid"]');
    this.trashLink = page.getByRole('link', { name: 'Trash' });
    this.emptyState = page.locator('text=No media files');
    this.fileInput = page.locator('input[type="file"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/media');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Creates a temporary PNG test file and returns its path. */
  static createTestFile(filename: string): string {
    const dir = resolve('/tmp/e2e-media');
    mkdirSync(dir, { recursive: true });
    const filePath = resolve(dir, filename);
    writeFileSync(filePath, Buffer.from(TEST_PNG_BASE64, 'base64'));
    return filePath;
  }

  /** Creates a file with specific content/size for validation tests. */
  static createTestFileWithContent(filename: string, content: Buffer): string {
    const dir = resolve('/tmp/e2e-media');
    mkdirSync(dir, { recursive: true });
    const filePath = resolve(dir, filename);
    writeFileSync(filePath, content);
    return filePath;
  }

  /** Upload a single file via the hidden file input. */
  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  /** Upload multiple files via the hidden file input. */
  async uploadFiles(filePaths: string[]): Promise<void> {
    await this.fileInput.setInputFiles(filePaths);
  }

  /** Wait for upload to complete (progress bar disappears or success toast). */
  async waitForUploadComplete(): Promise<void> {
    // Wait for uploading progress to finish — either dismiss button appears or uploads section disappears
    await this.page.waitForResponse((r) => r.url().includes('/api/media/upload') && r.status() === 201, {
      timeout: 30000,
    });
    // Small wait for UI to update
    await this.page.waitForTimeout(500);
  }

  getGridCardByFilename(filename: string): Locator {
    return this.page.locator('.media-card', { hasText: filename });
  }

  getRowByFilename(filename: string): Locator {
    return this.page.locator('tr', { has: this.page.locator('td', { hasText: filename }) });
  }

  /** Click delete on a grid card. */
  async clickDeleteOnCard(filename: string): Promise<void> {
    const card = this.getGridCardByFilename(filename);
    await card.hover();
    await card.locator('button', { has: this.page.locator('mat-icon', { hasText: 'delete' }) }).click();
  }

  /** Click edit (preview area) on a grid card. */
  async clickEditOnCard(filename: string): Promise<void> {
    const card = this.getGridCardByFilename(filename);
    await card.locator('.media-card__preview').click();
  }

  /** Click delete on a table row (list view). */
  async clickDeleteOnRow(filename: string): Promise<void> {
    const row = this.getRowByFilename(filename);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'delete' }) }).click();
  }

  /** Click edit button on a table row (list view). */
  async clickEditOnRow(filename: string): Promise<void> {
    const row = this.getRowByFilename(filename);
    await row.locator('button', { has: this.page.locator('mat-icon', { hasText: 'edit' }) }).click();
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/media') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/media') && r.status() === 200);
    await this.searchInput.clear();
    await responsePromise;
  }

  async switchToListView(): Promise<void> {
    await this.listToggle.click();
  }

  async switchToGridView(): Promise<void> {
    await this.gridToggle.click();
  }

  get dialog() {
    return {
      container: this.page.locator('mat-dialog-container'),
      altInput: this.page.locator('mat-dialog-container input[formControlName="altText"]'),
      captionInput: this.page.locator('mat-dialog-container textarea[formControlName="caption"]'),
      saveButton: this.page.locator('mat-dialog-container button', { hasText: 'Save' }),
      cancelButton: this.page.locator('mat-dialog-container button', { hasText: 'Cancel' }),
      serverError: this.page.locator('mat-dialog-container .text-red-500'),
    };
  }
}

export class MediaTrashPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly table: Locator;
  readonly paginator: Locator;
  readonly backLink: Locator;
  readonly emptyState: Locator;
  readonly restoreButton: Locator;
  readonly deleteForeverButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Trash' });
    this.table = page.locator('table');
    this.paginator = page.locator('mat-paginator');
    this.backLink = page.getByRole('link', { name: 'Back to Media' });
    this.emptyState = page.locator('text=Trash is empty');
    this.restoreButton = page.getByRole('button', { name: 'Restore' });
    this.deleteForeverButton = page.getByRole('button', { name: 'Delete Forever' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/media/trash');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  getRowByFilename(filename: string): Locator {
    return this.page.locator('tr', { has: this.page.locator('td', { hasText: filename }) });
  }

  async restoreItem(filename: string): Promise<void> {
    const row = this.getRowByFilename(filename);
    await row.locator('[data-testid="restore-btn"]').click();
  }

  async selectItem(filename: string): Promise<void> {
    const row = this.getRowByFilename(filename);
    await row.locator('mat-checkbox').click();
  }
}
