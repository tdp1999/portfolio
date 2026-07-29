import { type Locator, type Page } from '@playwright/test';

/**
 * `/admin/blog/new` and `/admin/blog/:id/edit`.
 *
 * Two things about this page break the assumptions older specs carry:
 *
 * 1. The route is `/admin/blog`, not `/blog`. `/blog` hits the catch-all `**` redirect in
 *    `app.routes.ts` and lands on the console home, so a spec that navigates there is
 *    asserting against the wrong page entirely.
 * 2. Unlike the skill and project editors this page does *not* use `console-section-tabs`.
 *    It is a two-column layout — a Body card on the left and a metadata sidebar on the
 *    right — with every card always on screen. There is nothing to activate.
 */
export class PostFormPage {
  readonly heading: Locator;
  readonly titleInput: Locator;
  readonly excerptInput: Locator;
  readonly slugInput: Locator;
  readonly languageSelect: Locator;
  readonly statusSelect: Locator;
  readonly contentEditor: Locator;
  readonly saveBar: Locator;
  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^(New|Edit) Post$/ });
    // The title field carries no placeholder, so `input[placeholder*="title"]` finds nothing.
    this.titleInput = page.locator('input[formControlName="title"]');
    this.excerptInput = page.locator('textarea[formControlName="excerpt"]');
    this.slugInput = page.locator('input[formControlName="slug"]');
    this.languageSelect = page.locator('mat-select[formControlName="language"]');
    this.statusSelect = page.locator('mat-select[formControlName="status"]');
    this.contentEditor = page.locator('console-rich-text-editor');
    this.saveBar = page.locator('.sticky-save-bar');
    this.saveButton = this.saveBar.getByRole('button', { name: 'Save changes' });
  }

  // ── Featured image ──────────────────────────────────────────────────
  //
  // Two mutually exclusive shapes: with no image chosen there is a single "Choose image"
  // trigger; once one is set that trigger is replaced by a preview plus two icon buttons
  // ("Replace" / "Remove"). `featuredTrigger` covers both so callers do not have to branch.

  get overviewSection(): Locator {
    return this.page.locator('section#section-overview');
  }

  get featuredBlock(): Locator {
    return this.overviewSection.locator('.field-block').filter({ hasText: 'Featured image' });
  }

  get featuredChooseButton(): Locator {
    return this.featuredBlock.getByRole('button', { name: 'Choose image' });
  }

  get featuredReplaceButton(): Locator {
    return this.featuredBlock.locator('button[mattooltip="Replace"]');
  }

  get featuredRemoveButton(): Locator {
    return this.featuredBlock.locator('button[mattooltip="Remove"]');
  }

  get featuredPreview(): Locator {
    return this.featuredBlock.locator('img[alt="Featured"]');
  }

  /** Open the picker whether or not an image is already set. */
  async openFeaturedPicker(): Promise<void> {
    const trigger = (await this.featuredPreview.isVisible()) ? this.featuredReplaceButton : this.featuredChooseButton;
    await trigger.click();
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/blog');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/admin/blog/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(postId: string): Promise<void> {
    await this.page.goto(`/admin/blog/${postId}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** The list page's "New Post" is `<a routerLink="./new">` — a link, never role=button. */
  get newPostLink(): Locator {
    return this.page.getByRole('link', { name: 'New Post' });
  }

  /** Click Save changes and wait for the write to land on `/api/admin/blog`. */
  async save(method: 'POST' | 'PATCH' = 'POST'): Promise<number> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/admin/blog') && r.request().method() === method
    );
    await this.saveButton.click();
    return (await responsePromise).status();
  }
}
