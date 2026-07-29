import { expect, type Locator, type Page } from '@playwright/test';
import { SectionCard, SectionTabs } from './section-form.page';
import { MediaPickerPage } from './media-picker.page';
import { clickConfirm } from '../helpers/dialog';

// ── Page Object ─────────────────────────────────────────────────────────────

/** Rail label for each section id — `profile.ts` `groups` is the source of truth. */
const SECTION_LABELS = {
  'section-identity': 'Identity',
  'section-work-availability': 'Work & Availability',
  'section-contact': 'Contact',
  'section-location': 'Location',
  'section-social-links': 'Social Links',
  'section-landing-home': 'Home page',
  'section-landing-footer': 'Footer',
  'section-landing-about': 'About page',
  'section-seo-og': 'SEO / OG',
  'section-admin-contact-address': 'Admin Contact & Address',
} as const;

export type ProfileSectionId = keyof typeof SECTION_LABELS;

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly rail: SectionTabs;

  // Section cards
  readonly identity: SectionCard;
  readonly workAvailability: SectionCard;
  readonly contact: SectionCard;
  readonly location: SectionCard;
  readonly socialLinks: SectionCard;
  readonly seoOg: SectionCard;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Profile Settings' });
    this.rail = new SectionTabs(page);

    this.identity = new SectionCard(page, 'section-identity');
    this.workAvailability = new SectionCard(page, 'section-work-availability');
    this.contact = new SectionCard(page, 'section-contact');
    this.location = new SectionCard(page, 'section-location');
    this.socialLinks = new SectionCard(page, 'section-social-links');
    this.seoOg = new SectionCard(page, 'section-seo-og');
  }

  /**
   * Bring one section on screen and wait for it.
   *
   * Every section body is rendered but gated with `[hidden]="!showAll() && activeId() !== id"`
   * (`profile.html`), so a section that has not been selected resolves as a locator yet never
   * becomes visible — which is why an untouched spec fails as a 30s click timeout rather than
   * as "element not found". Call this before touching anything inside a section.
   */
  async activate(sectionId: ProfileSectionId): Promise<Locator> {
    await this.rail.item(SECTION_LABELS[sectionId]).click();
    const section = this.page.locator(`section#${sectionId}`);
    await section.waitFor({ state: 'visible', timeout: 10_000 });
    return section;
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
    // Wait for loading spinner to disappear (profile data fetch)
    await this.page
      .locator('console-spinner-overlay[ng-reflect-loading="true"]')
      .waitFor({ state: 'detached', timeout: 10_000 })
      .catch(() => {
        /* spinner may already be gone */
      });
  }

  /**
   * Load `/profile` with every section body on screen.
   *
   * The page defaults to tabbed mode, where exactly one section is visible and the rest
   * are `[hidden]`. Specs that reason across sections at once — "editing Identity leaves
   * Contact pristine" — need the "Show all sections" mode the toggle provides.
   */
  async gotoAllSections(): Promise<void> {
    await this.goto();
    await this.rail.selectAll();
    await this.seoOg.root.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async gotoWithFragment(fragment: string): Promise<void> {
    await this.page.goto(`/profile#${fragment}`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
    await this.page
      .locator('console-spinner-overlay[ng-reflect-loading="true"]')
      .waitFor({ state: 'detached', timeout: 10_000 })
      .catch(() => {
        // Spinner may have already detached before the wait started; ignore.
      });
  }

  // ── Identity helpers ────────────────────────────────────────────────

  async fillIdentity(data: {
    fullNameEn: string;
    fullNameVi: string;
    titleEn: string;
    titleVi: string;
    bioShortEn: string;
    bioShortVi: string;
  }): Promise<void> {
    await this.identity.field('Full Name (EN)').fill(data.fullNameEn);
    await this.identity.field('Full Name (VI)').fill(data.fullNameVi);
    await this.identity.field('Title (EN)').fill(data.titleEn);
    await this.identity.field('Title (VI)').fill(data.titleVi);
    await this.identity.field('Short Bio (EN)').fill(data.bioShortEn);
    await this.identity.field('Short Bio (VI)').fill(data.bioShortVi);
  }

  // ── Contact helpers ─────────────────────────────────────────────────

  async clearAndFillEmail(value: string): Promise<void> {
    await this.contact.field('Email').fill(value);
  }

  // ── Work & Availability helpers ─────────────────────────────────────

  async selectAvailability(label: string): Promise<void> {
    await this.workAvailability.root.locator('mat-select[formcontrolname="availability"]').click();
    await this.page.getByRole('option', { name: label }).click();
  }

  toggleOpenTo(label: string): Locator {
    return this.workAvailability.root.locator('.chip-toggle', { hasText: label });
  }

  // ── Social links helpers ────────────────────────────────────────────

  async addSocialLink(platform: string, url: string): Promise<void> {
    // Same row-count wait as `addCertification`, for the same reason: `.last()` would otherwise
    // resolve before the new row renders and overwrite the previous one.
    const rows = this.socialLinks.root.locator('.social-link-row');
    const before = await rows.count();
    await this.socialLinks.root.getByRole('button', { name: 'Add Link' }).click();
    await expect(rows).toHaveCount(before + 1);

    const lastRow = rows.last();
    await lastRow.locator('mat-select[formcontrolname="platform"]').click();
    await this.page.getByRole('option', { name: platform }).click();
    await lastRow.getByLabel('URL').fill(url);
  }

  // ── Avatar / OG image helpers ───────────────────────────────────────
  //
  // Both triggers are icon-only buttons (`button.media-trigger--{avatar,og}`) whose only
  // accessible name is an `aria-label` — they carry no text, so `hasText: 'Change'` never
  // matches. Neither id is a form control either: `avatarId` / `ogImageId` are signals and
  // the section saves them on pick, so assert against the preview `<img>`, not an input.

  // Getters, not field initializers: `identity` / `seoOg` are assigned in the constructor,
  // which runs after field initializers would.
  get avatarTrigger(): Locator {
    return this.identity.root.getByRole('button', { name: 'Change avatar' });
  }
  get avatarPreview(): Locator {
    return this.identity.root.locator('img[alt="Avatar preview"]');
  }
  get avatarRemoveButton(): Locator {
    return this.identity.root.getByRole('button', { name: 'Remove photo' });
  }

  get ogImageTrigger(): Locator {
    return this.seoOg.root.getByRole('button', { name: 'Change OG image' });
  }
  get ogImagePreview(): Locator {
    return this.seoOg.root.locator('img[alt="OG image preview"]');
  }
  get ogImageRemoveButton(): Locator {
    return this.seoOg.root.getByRole('button', { name: 'Remove image' });
  }

  /**
   * Pick the first image in the picker as the avatar. Resolves to the URL now on the profile.
   *
   * Neither image belongs to a section form. `openAvatarPicker()` PATCHes
   * `/admin/profile/avatar` the moment the dialog closes — the Identity card says as much in its
   * own subtitle, "Avatar saves on upload" — and `openOgImagePicker()` behaves the same way. So
   * there is nothing left to save afterwards, and a spec that clicks "Save section" next waits
   * out its 30s timeout on a button that stays `disabled` because the form never became dirty.
   *
   * The URL comes from the response body rather than being derived from the media id, because
   * `UpdateAvatarHandler` returns `media.url` — a storage path that does **not** embed the id.
   * Asserting `src` against the id therefore never matches, however plausible it looks.
   */
  async pickAvatar(): Promise<string> {
    return this.pickImage(this.avatarTrigger, '/admin/profile/avatar', 'avatarUrl');
  }

  async pickOgImage(): Promise<string> {
    return this.pickImage(this.ogImageTrigger, '/admin/profile/og-image', 'ogImageUrl');
  }

  private async pickImage(trigger: Locator, endpoint: string, urlKey: string): Promise<string> {
    await trigger.click();

    const picker = new MediaPickerPage(this.page);
    await picker.waitForOpen();

    const persisted = this.page.waitForResponse((r) => r.url().includes(endpoint) && r.request().method() === 'PATCH');
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    const response = await persisted;
    expect(response.status()).toBe(200);

    const body = (await response.json()) as Record<string, string | null>;
    const url = body[urlKey];
    if (!url) throw new Error(`PATCH ${endpoint} returned no ${urlKey}`);
    return url;
  }

  /** Clear the avatar. Goes through the "Remove Avatar" confirmation, which is easy to miss. */
  async removeAvatar(): Promise<void> {
    const persisted = this.page.waitForResponse(
      (r) => r.url().includes('/admin/profile/avatar') && r.request().method() === 'PATCH'
    );
    await this.avatarRemoveButton.click();
    await clickConfirm(this.page);
    expect((await persisted).status()).toBe(200);
  }

  // ── Resume helpers ──────────────────────────────────────────────────
  //
  // Resume is a subsection of Social Links, not a section of its own: there is no
  // `section#section-resume` and no `[data-locale]` attribute. A row is `.resume-row`
  // and is identified by its `.locale-badge` text.

  resumeRow(locale: 'EN' | 'VI'): Locator {
    return this.socialLinks.root
      .locator('.resume-row')
      .filter({ has: this.page.locator('.locale-badge', { hasText: new RegExp(`^${locale}$`) }) });
  }

  resumeChangeButton(locale: 'EN' | 'VI'): Locator {
    return this.resumeRow(locale).getByRole('button', { name: 'Change' });
  }

  /** The remove control is an icon button — it renders only once the row holds a URL. */
  resumeRemoveButton(locale: 'EN' | 'VI'): Locator {
    return this.resumeRow(locale).locator('button[mattooltip="Remove"]');
  }

  /** The picked file renders as `a.resume-link`; an empty row shows "No file selected". */
  resumeLink(locale: 'EN' | 'VI'): Locator {
    return this.resumeRow(locale).locator('a.resume-link');
  }

  async resumeUrl(locale: 'EN' | 'VI'): Promise<string | null> {
    const link = this.resumeLink(locale);
    return (await link.count()) === 0 ? null : link.getAttribute('href');
  }

  // ── Certifications helpers ──────────────────────────────────────────
  //
  // Certifications are a subsection of Social Links, like Resume: there is no
  // `section#section-certifications` and no `/profile#certifications` fragment. A row is
  // `.cert-row`, and rows are *not* `[role="group"]`.

  certRows(): Locator {
    return this.socialLinks.root.locator('.cert-row');
  }

  addCertificationButton(): Locator {
    return this.socialLinks.root.getByRole('button', { name: 'Add Certification' });
  }

  /** Rendered in place of the rows while the array is empty. */
  certEmptyState(): Locator {
    return this.socialLinks.root.getByText('No certifications added yet.');
  }

  /**
   * Append a row and fill it. Name, issuer and year are all `Validators.required`, and the
   * year control is pre-seeded with the current year, so it must be cleared before filling.
   *
   * The row-count wait is not defensive padding — without it this method silently overwrites the
   * previous row. `.last()` resolves against the DOM as it is, and the click returns before Angular
   * has rendered the new group, so on the second call `.last()` was still row 0: the earlier
   * certification got its values replaced and the freshly added row stayed empty. An empty row fails
   * three `required` validators, which makes the section invalid, which makes `save()` return
   * before it issues a request — surfacing much later as "Save section produced no PATCH".
   */
  async addCertification(name: string, issuer: string, year: number): Promise<void> {
    const before = await this.certRows().count();
    await this.addCertificationButton().click();
    await expect(this.certRows()).toHaveCount(before + 1);

    const lastRow = this.certRows().last();
    await lastRow.getByLabel('Name').fill(name);
    await lastRow.getByLabel('Issuer').fill(issuer);
    const yearInput = lastRow.getByLabel('Year');
    await yearInput.clear();
    await yearInput.fill(String(year));
  }

  /**
   * The mode chip for one row.
   *
   * `option`, not `radio`, and `aria-selected`, not `aria-checked`. `chip-select.html` does write
   * `[attr.role]="'radio'"` and `[attr.aria-checked]` onto each `mat-chip-option`, so reading the
   * source suggests otherwise — but `MatChipOption` renders an inner `<button role="option">` that
   * owns the accessible name, and that is what surfaces in the accessibility tree. Confirmed from
   * a failure's ARIA snapshot:
   *
   *     - radiogroup:
   *       - option "Link" [selected]
   *       - option "File"
   *
   * Which is also why the list POMs' `getByRole('option', { name: 'Show deleted' })` works.
   */
  certificationModeChip(row: Locator, mode: 'Link' | 'File'): Locator {
    return row.locator('console-chip-select').getByRole('option', { name: mode, exact: true });
  }

  /**
   * Switch a certification row between a typed URL and a picked file.
   *
   * A new row starts in "Link" mode, so the "Choose file" button does not exist yet —
   * a spec that clicks it straight after Add Certification waits out the full timeout.
   */
  async setCertificationMode(row: Locator, mode: 'Link' | 'File'): Promise<void> {
    await this.certificationModeChip(row, mode).click();
  }

  /** Assert which mode a row is in. `aria-selected` — the inner `option` owns the state. */
  async expectCertificationMode(row: Locator, mode: 'Link' | 'File'): Promise<void> {
    await expect(this.certificationModeChip(row, mode)).toHaveAttribute('aria-selected', 'true');
  }

  certificationChooseFileButton(row: Locator): Locator {
    return row.getByRole('button', { name: /choose file/i });
  }

  /** Link mode only — the URL is a text control; in File mode it is an `a.cert-file-link`. */
  certificationUrlInput(row: Locator): Locator {
    return row.getByLabel('URL');
  }

  certificationFileLink(row: Locator): Locator {
    return row.locator('a.cert-file-link');
  }

  certificationRemoveButton(row: Locator): Locator {
    return row.locator('button[mattooltip="Remove"]');
  }
}
