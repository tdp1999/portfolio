import { expect, type Locator, type Page } from '@playwright/test';

// ── Section-scoped locator helpers ──────────────────────────────────────────

class SectionCard {
  readonly root: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    readonly page: Page,
    sectionId: string
  ) {
    this.root = page.locator(`section#${sectionId}`);
    this.saveButton = this.root.getByRole('button', { name: 'Save section' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }

  /** Click Save section, wait for the PATCH response on `endpoint`. */
  async save(endpoint: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes(endpoint) && r.request().method() === 'PATCH'
    );
    await this.saveButton.click();
    await responsePromise;
  }

  /** Fill a mat-form-field by its mat-label text within this section. */
  field(label: string): Locator {
    return this.root.getByLabel(label);
  }
}

// ── Rail locators ───────────────────────────────────────────────────────────

class RailLocator {
  readonly nav: Locator;

  constructor(readonly page: Page) {
    this.nav = page.locator('nav.scrollspy-rail');
  }

  item(label: string): Locator {
    return this.nav.getByRole('button', { name: label });
  }

  /** Assert which rail item has `aria-current="true"`. */
  async expectActive(label: string): Promise<void> {
    await expect(this.item(label)).toHaveAttribute('aria-current', 'true');
  }

  /** Get the status icon text (✓, ●, ⚠, ○) for a rail item. */
  iconFor(label: string): Locator {
    return this.item(label).locator('.scrollspy-rail__icon');
  }
}

// ── Page Object ─────────────────────────────────────────────────────────────

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly rail: RailLocator;

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
    this.rail = new RailLocator(page);

    this.identity = new SectionCard(page, 'section-identity');
    this.workAvailability = new SectionCard(page, 'section-work-availability');
    this.contact = new SectionCard(page, 'section-contact');
    this.location = new SectionCard(page, 'section-location');
    this.socialLinks = new SectionCard(page, 'section-social-links');
    this.seoOg = new SectionCard(page, 'section-seo-og');
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

  async gotoWithFragment(fragment: string): Promise<void> {
    await this.page.goto(`/profile#${fragment}`);
    await this.heading.waitFor({ state: 'visible', timeout: 10_000 });
    await this.page
      .locator('console-spinner-overlay[ng-reflect-loading="true"]')
      .waitFor({ state: 'detached', timeout: 10_000 })
      .catch(() => {});
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
    await this.socialLinks.root.getByRole('button', { name: 'Add Link' }).click();
    const lastRow = this.socialLinks.root.locator('.social-link-row').last();
    await lastRow.locator('mat-select[formcontrolname="platform"]').click();
    await this.page.getByRole('option', { name: platform }).click();
    await lastRow.getByLabel('URL').fill(url);
  }

  // ── Certifications helpers ──────────────────────────────────────────

  async addCertification(name: string, issuer: string, year: number): Promise<void> {
    await this.socialLinks.root.getByRole('button', { name: 'Add Certification' }).click();
    const lastRow = this.socialLinks.root.locator('.cert-row').last();
    await lastRow.getByLabel('Name').fill(name);
    await lastRow.getByLabel('Issuer').fill(issuer);
    const yearInput = lastRow.getByLabel('Year');
    await yearInput.clear();
    await yearInput.fill(String(year));
  }
}
