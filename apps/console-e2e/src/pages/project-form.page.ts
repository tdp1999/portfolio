import { type Locator, type Page } from '@playwright/test';
import { SectionFormPage } from './section-form.page';

/** Rail label for each section id — `project.form.ts` `sections` is the source of truth. */
const SECTION_LABELS = {
  'section-basic': 'Basic',
  'section-story': 'Story',
  'section-highlights': 'Highlights',
  'section-media': 'Media',
  'section-details': 'Details',
  'section-settings': 'Settings',
} as const;

export type ProjectSectionId = keyof typeof SECTION_LABELS;

/**
 * `/projects/new` and `/projects/:id/edit`.
 *
 * Routed full page, not a dialog: the list's "Create Project" button calls
 * `openCreateDialog()`, which despite the name only does `router.navigate(['/projects','new'])`.
 * Unlike the skill editor this page starts with `showAll = signal(false)`, so every section
 * other than Basic is `[hidden]` until `activate()` runs.
 */
export class ProjectFormPage extends SectionFormPage<ProjectSectionId> {
  protected readonly labels = SECTION_LABELS;

  readonly heading: Locator;
  readonly titleInput: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: /^(Create|Edit) Project$/ });
    this.titleInput = page.locator('input[formControlName="title"]');
  }

  // ── Media section ───────────────────────────────────────────────────
  //
  // Thumbnail and gallery are both signal-backed (`thumbnailId()`, `galleryImages()`), so
  // there is no `formControlName="galleryIds"` to read. The gallery's own trigger is labelled
  // "Add Images" — a `hasText: /gallery/i` filter matches only the `<p class="field-label">`
  // heading, never a button.

  get mediaSection(): Locator {
    return this.section('section-media');
  }

  get thumbnailTrigger(): Locator {
    return this.mediaSection.getByRole('button', { name: /(Change|Choose) Thumbnail/ });
  }

  get thumbnailPreview(): Locator {
    return this.mediaSection.locator('img[alt="Thumbnail"]');
  }

  get thumbnailClearButton(): Locator {
    return this.mediaSection.locator('button[aria-label="Clear thumbnail"]');
  }

  get galleryTrigger(): Locator {
    return this.mediaSection.getByRole('button', { name: 'Add Images' });
  }

  get galleryRows(): Locator {
    return this.mediaSection.locator('.gallery-row');
  }

  /** The "Gallery Images (N)" label — the only place the count is rendered. */
  get galleryCountLabel(): Locator {
    return this.mediaSection.locator('.field-label', { hasText: /^Gallery Images/ });
  }

  async galleryCount(): Promise<number> {
    const text = await this.galleryCountLabel.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  galleryRowRemoveButton(index: number): Locator {
    return this.galleryRows.nth(index).locator('button[aria-label="Remove image"]');
  }

  async gotoNew(): Promise<void> {
    await this.page.goto('/projects/new');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoEdit(projectId: string): Promise<void> {
    await this.page.goto(`/projects/${projectId}/edit`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Click Save changes and wait for the write to land on `/api/projects`.
   *
   * Update is **PUT** (`ProjectService.update` → `api.put`); PATCH on this resource is
   * restore/reorder, so waiting on PATCH would match the wrong call.
   */
  async save(method: 'POST' | 'PUT' = 'POST'): Promise<number> {
    return this.saveAndWait('/api/projects', method);
  }
}
