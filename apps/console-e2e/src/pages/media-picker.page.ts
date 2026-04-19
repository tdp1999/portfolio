import { type Locator, type Page, expect } from '@playwright/test';

export class MediaPickerPage {
  readonly dialog: Locator;
  readonly libraryTab: Locator;
  readonly uploadTab: Locator;
  readonly closeButton: Locator;
  readonly filterBar: Locator;
  readonly grid: Locator;
  readonly insertButton: Locator;
  readonly cancelButton: Locator;
  readonly selectedCount: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.locator('console-media-picker-dialog');
    this.libraryTab = page.locator('mat-tab-label', { hasText: 'Library' });
    this.uploadTab = page.locator('mat-tab-label', { hasText: 'Upload' });
    this.closeButton = this.dialog.locator('button[aria-label="Close dialog"]');
    this.filterBar = this.dialog.locator('console-asset-filter-bar');
    this.grid = this.dialog.locator('console-asset-grid');
    this.insertButton = this.dialog.getByRole('button', { name: /insert|select/i });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.selectedCount = this.dialog.locator('.picker__count');
  }

  /** Wait for the picker to open (dialog visible) */
  async waitForOpen(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Wait for the picker to close (dialog detached) */
  async waitForClose(): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /** Click on a MIME group filter chip (image, video, pdf, doc, archive) */
  async filterByMime(group: 'image' | 'video' | 'pdf' | 'doc' | 'archive'): Promise<void> {
    const chipLabel = this.filterBar.locator('button', { hasText: new RegExp(`^${group}`, 'i') });
    await chipLabel.click();
    // Wait for grid to update
    await this.page.waitForResponse((r) => r.url().includes('/api/media/list') && r.status() === 200);
  }

  /** Sort media by a specific option (e.g., 'newest', 'oldest', 'name-asc') */
  async sortBy(option: string): Promise<void> {
    const sortSelect = this.filterBar.locator('mat-select').first();
    await sortSelect.click();
    const sortOption = this.page.locator('mat-option', { hasText: option });
    await sortOption.click();
    // Wait for grid to update
    await this.page.waitForResponse((r) => r.url().includes('/api/media/list') && r.status() === 200);
  }

  /** Search for media by filename or text */
  async search(query: string): Promise<void> {
    const searchInput = this.filterBar.locator('input[placeholder*="Search"]');
    await searchInput.fill(query);
    // Wait for grid to update
    await this.page.waitForResponse((r) => r.url().includes('/api/media/list') && r.status() === 200);
  }

  /** Clear all filters */
  async clearFilters(): Promise<void> {
    const clearButton = this.filterBar.locator('button', { hasText: 'Clear' });
    await clearButton.click();
    // Wait for grid to update
    await this.page.waitForResponse((r) => r.url().includes('/api/media/list') && r.status() === 200);
  }

  /** Select a media item by visible text (filename) */
  async selectByName(filename: string): Promise<void> {
    const card = this.grid.locator('button', { hasText: filename });
    await card.click();
    // Wait for selection to register
    await this.page.waitForTimeout(500);
  }

  /** Select media by ID (attribute) */
  async selectById(id: string): Promise<void> {
    const card = this.grid.locator(`[data-media-id="${id}"]`);
    await card.click();
  }

  /** Get count of selected items */
  async getSelectedCount(): Promise<number> {
    const text = await this.selectedCount.textContent();
    const match = text?.match(/(\d+) selected/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Switch to Upload tab */
  async switchToUpload(): Promise<void> {
    await this.uploadTab.click();
    const uploadZone = this.dialog.locator('console-asset-upload-zone');
    await uploadZone.waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Switch to Library tab */
  async switchToLibrary(): Promise<void> {
    await this.libraryTab.click();
    await this.grid.waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Toggle between grid and list view */
  async toggleViewMode(): Promise<void> {
    const viewToggle = this.dialog.locator('.picker__view-toggle');
    await viewToggle.click();
  }

  /** Upload a file via the upload zone */
  async uploadFile(filePath: string): Promise<void> {
    await this.switchToUpload();
    const uploadInput = this.dialog.locator('input[type="file"]');
    await uploadInput.setInputFiles(filePath);

    // Wait for upload to complete
    await this.page.waitForResponse((r) => r.url().includes('/api/media/upload') && r.status() === 201, {
      timeout: 30000,
    });

    // Auto-select should have happened; verify grid shows the file
    await this.switchToLibrary();
    await this.page.waitForTimeout(500);
  }

  /** Click Insert button to confirm selection */
  async clickInsert(): Promise<void> {
    await this.insertButton.click();
    // Wait for dialog to close
    await this.waitForClose();
  }

  /** Click Cancel button */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForClose();
  }

  /** Test keyboard navigation and selection */
  async navigateWithArrowKeys(direction: 'up' | 'down' | 'left' | 'right', count = 1): Promise<void> {
    const keyMap: Record<string, string> = {
      up: 'ArrowUp',
      down: 'ArrowDown',
      left: 'ArrowLeft',
      right: 'ArrowRight',
    };
    for (let i = 0; i < count; i++) {
      await this.page.keyboard.press(keyMap[direction]);
      await this.page.waitForTimeout(200);
    }
  }

  /** Select focused item with Space key */
  async selectWithSpace(): Promise<void> {
    await this.page.keyboard.press('Space');
    await this.page.waitForTimeout(300);
  }

  /** Confirm selection with Enter key */
  async confirmWithEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await this.waitForClose();
  }

  /** Get media items in grid (for verification) */
  getGridItems(): Locator {
    return this.grid.locator('[data-media-id]');
  }

  /** Check if Insert button is enabled */
  async isInsertEnabled(): Promise<boolean> {
    return !(await this.insertButton.isDisabled());
  }

  /** Get recently-used items */
  getRecentlyUsedItems(): Locator {
    return this.dialog.locator('console-recently-used-strip button[data-media-id]');
  }
}
