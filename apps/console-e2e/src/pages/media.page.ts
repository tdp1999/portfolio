import { expect, type Locator, type Page } from '@playwright/test';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { TEST_PNG_BASE64, TEST_PDF_BASE64 } from '../data/test-media';

/**
 * `/media` — the media library.
 *
 * The page was rebuilt out of shared components, and almost none of the old selectors survive:
 *
 * - upload is `console-asset-upload-zone`, whose `aria-label` is the full sentence
 *   "Upload files — drag and drop or press Enter to browse", not "Upload files";
 * - search is `console-asset-filter-bar`, labelled just "Search";
 * - the grid is `console-asset-grid`. Items are `button.asset-grid__item` carrying
 *   `aria-label`=filename and `data-media-id` — there is no `.media-card`, and **list view is
 *   still the same component**, rendering the same items with an `--list` modifier rather than a
 *   `<table>`; there is no `.asset-grid__row` container at all;
 * - grid paging is internal to `console-asset-grid`; there is no `mat-paginator`;
 * - the view toggle is a `console-chip-select`, which is a `listbox` of **`option`**s, never
 *   `radio`. `MatChipOption`'s inner `<button role="option">` owns the accessible name and is what
 *   the a11y tree exposes; because the toggle runs `iconOnly`, that name comes from the `aria-label`
 *   ("Grid view" / "List view") which Material forwards to the inner button. Selected state is
 *   `aria-selected`, not `aria-checked`;
 * - editing metadata is a **drawer** (`console-media-drawer`), not a dialog, and deleting is a
 *   button inside that drawer rather than a per-card control.
 */
export class MediaPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly dropzone: Locator;
  readonly searchInput: Locator;
  readonly grid: Locator;
  readonly listRows: Locator;
  readonly listToggle: Locator;
  readonly gridToggle: Locator;
  readonly trashLink: Locator;
  readonly emptyState: Locator;
  readonly uploadErrors: Locator;
  readonly fileInput: Locator;
  readonly batchBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Media Library', level: 1 });
    this.dropzone = page.locator('[role="button"][aria-label^="Upload files"]');
    this.searchInput = page.locator('console-asset-filter-bar input[type="search"]');
    this.grid = page.locator('.asset-grid');
    // `console-asset-grid` renders one element per asset in *both* modes and only swaps a
    // modifier class: `.asset-grid__item--grid` / `.asset-grid__item--list`. There is no
    // `.asset-grid__row` — the `row-` prefixed classes are the inner cells of a list item
    // (`__row-thumb`, `__row-name`, `__row-meta`), never a row container.
    this.listRows = page.locator('.asset-grid__item--list');
    this.listToggle = page.getByRole('option', { name: 'List view' });
    this.gridToggle = page.getByRole('option', { name: 'Grid view' });
    this.trashLink = page.getByRole('link', { name: 'Trash' });
    this.emptyState = page.getByText('No media found');
    this.uploadErrors = page.locator('.upload-zone__errors');
    this.fileInput = page.locator('input[type="file"]');
    this.batchBar = page.locator('.batch-bar');
  }

  async goto(): Promise<void> {
    await this.page.goto('/media');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
    await this.waitForGridSettled();
  }

  /** `console-asset-grid` flips `aria-busy` while loading, then renders items or the empty state. */
  async waitForGridSettled(): Promise<void> {
    await expect(this.grid).not.toHaveAttribute('aria-busy', 'true', { timeout: 10_000 });
  }

  /**
   * Creates a temporary PNG test file and returns its path.
   *
   * The contents are always PNG regardless of the name you pass, so a `.pdf` argument here
   * produces a file the API rejects — `FileSecurityScanner` checks magic bytes against the
   * extension-derived MIME type. Use `createTestPdf` when you need a real PDF.
   */
  static createTestFile(filename: string): string {
    const dir = resolve('/tmp/e2e-media');
    mkdirSync(dir, { recursive: true });
    const filePath = resolve(dir, filename);
    writeFileSync(filePath, Buffer.from(TEST_PNG_BASE64, 'base64'));
    return filePath;
  }

  /** Creates a temporary single-page PDF and returns its path. */
  static createTestPdf(filename: string): string {
    const dir = resolve('/tmp/e2e-media');
    mkdirSync(dir, { recursive: true });
    const filePath = resolve(dir, filename);
    writeFileSync(filePath, Buffer.from(TEST_PDF_BASE64, 'base64'));
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

  /**
   * A grid item, in either view mode — `console-asset-grid` renders both, so there is one
   * locator, not a card/row pair.
   *
   * Matched on the item's **own** `aria-label`, which is `item.originalFilename`. The previous
   * `filter({ has: getByLabel(filename) })` could never match: `has` requires the labelled element
   * to be a *descendant*, and the label is on the item itself. It also would not have helped to
   * look for the thumbnail — `getByLabel` reads `aria-label`/`<label>`, not an `<img alt>`.
   */
  getItemByFilename(filename: string): Locator {
    return this.page.locator(`.asset-grid__item[aria-label="${filename}"]`);
  }

  /**
   * Open the detail drawer, which is where metadata is edited.
   *
   * **Double**-click. `console-asset-grid` binds a single click to `toggleSelection` — that is the
   * batch-operation checkbox — and only `(dblclick)` (or Enter on a focused item) emits
   * `itemActivated`, which is what sets `?selected=<id>` and mounts the drawer. A single click
   * therefore selects the asset and leaves the drawer unmounted, so the wait below times out
   * against markup that is behind `@if (selectedId())` and was never asked to render.
   */
  async openDrawer(filename: string): Promise<MediaDrawer> {
    await this.getItemByFilename(filename).dblclick();
    const drawer = new MediaDrawer(this.page);
    await drawer.root.waitFor({ state: 'visible', timeout: 10_000 });
    return drawer;
  }

  async search(query: string): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/media') && r.status() === 200);
    await this.searchInput.fill(query);
    await responsePromise;
    await this.waitForGridSettled();
  }

  async clearSearch(): Promise<void> {
    const responsePromise = this.page.waitForResponse((r) => r.url().includes('/api/media') && r.status() === 200);
    await this.searchInput.clear();
    await responsePromise;
    await this.waitForGridSettled();
  }

  async switchToListView(): Promise<void> {
    await this.listToggle.click();
  }

  async switchToGridView(): Promise<void> {
    await this.gridToggle.click();
  }
}

/** `console-media-drawer` — the side panel that replaced the metadata dialog. */
export class MediaDrawer {
  readonly root: Locator;
  readonly altInput: Locator;
  readonly captionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.root = page.locator('[aria-label="Media details"]');
    this.altInput = this.root.locator('input[formControlName="altText"]');
    this.captionInput = this.root.locator('textarea[formControlName="caption"]');
    // Disabled until the form is dirty — `[disabled]="!dirty() || submitting()"`.
    this.saveButton = this.root.getByRole('button', { name: 'Save' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
    this.deleteButton = this.root.getByRole('button', { name: 'Delete' });
    this.closeButton = this.root.getByRole('button', { name: 'Close drawer' });
  }

  async save(): Promise<number> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/media') && r.request().method() === 'PATCH'
    );
    await this.saveButton.click();
    return (await responsePromise).status();
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
