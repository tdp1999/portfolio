import { type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly saveButton: Locator;

  // Identity
  readonly fullNameEn: Locator;
  readonly fullNameVi: Locator;
  readonly titleEn: Locator;
  readonly titleVi: Locator;
  readonly bioShortEn: Locator;
  readonly bioShortVi: Locator;

  // Work
  readonly yearsOfExperience: Locator;
  readonly availability: Locator;

  // Contact
  readonly email: Locator;
  readonly phone: Locator;
  readonly preferredContactPlatform: Locator;
  readonly preferredContactValue: Locator;

  // Location
  readonly locationCountry: Locator;
  readonly locationCity: Locator;

  // Social Links
  readonly addSocialLinkButton: Locator;

  // Certifications
  readonly addCertificationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Profile Settings' });
    this.saveButton = page.getByRole('button', { name: 'Save Profile' }).first();

    // Identity
    this.fullNameEn = page.locator('input[formControlName="fullName_en"]');
    this.fullNameVi = page.locator('input[formControlName="fullName_vi"]');
    this.titleEn = page.locator('input[formControlName="title_en"]');
    this.titleVi = page.locator('input[formControlName="title_vi"]');
    this.bioShortEn = page.locator('textarea[formControlName="bioShort_en"]');
    this.bioShortVi = page.locator('textarea[formControlName="bioShort_vi"]');

    // Work
    this.yearsOfExperience = page.locator('input[formControlName="yearsOfExperience"]');
    this.availability = page.locator('mat-select[formControlName="availability"]');

    // Contact
    this.email = page.locator('input[formControlName="email"]');
    this.phone = page.locator('input[formControlName="phone"]');
    this.preferredContactPlatform = page.locator('mat-select[formControlName="preferredContactPlatform"]');
    this.preferredContactValue = page.locator('input[formControlName="preferredContactValue"]');

    // Location
    this.locationCountry = page.locator('input[formControlName="locationCountry"]');
    this.locationCity = page.locator('input[formControlName="locationCity"]');

    // Social Links
    this.addSocialLinkButton = page.getByRole('button', { name: 'Add Link' });

    // Certifications
    this.addCertificationButton = page.getByRole('button', { name: 'Add Certification' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for loading spinner to disappear (profile data fetch)
    await this.page
      .locator('console-spinner-overlay[ng-reflect-loading="true"]')
      .waitFor({ state: 'detached', timeout: 10000 })
      .catch(() => {
        // No spinner found, continue
      });
  }

  async selectAvailability(label: string): Promise<void> {
    await this.availability.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async selectPreferredContactPlatform(label: string): Promise<void> {
    await this.preferredContactPlatform.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  toggleOpenTo(label: string): Locator {
    return this.page.locator('.chip-toggle', { hasText: label });
  }

  async save(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/api/admin/profile') && r.request().method() === 'PUT'
    );
    await this.saveButton.click();
    await responsePromise;
  }

  async addSocialLink(platform: string, url: string): Promise<void> {
    await this.addSocialLinkButton.click();
    const rows = this.page.locator('.social-link-row');
    const lastRow = rows.last();
    await lastRow.locator('mat-select[formControlName="platform"]').click();
    await this.page.getByRole('option', { name: platform }).click();
    await lastRow.locator('input[formControlName="url"]').fill(url);
  }

  async addCertification(name: string, issuer: string, year: number): Promise<void> {
    await this.addCertificationButton.click();
    const rows = this.page.locator('.cert-row');
    const lastRow = rows.last();
    await lastRow.locator('input[formControlName="name"]').fill(name);
    await lastRow.locator('input[formControlName="issuer"]').fill(issuer);
    const yearInput = lastRow.locator('input[formControlName="year"]');
    await yearInput.clear();
    await yearInput.fill(String(year));
  }

  async fillIdentity(data: {
    fullNameEn: string;
    fullNameVi: string;
    titleEn: string;
    titleVi: string;
    bioShortEn: string;
    bioShortVi: string;
  }): Promise<void> {
    await this.fullNameEn.fill(data.fullNameEn);
    await this.fullNameVi.fill(data.fullNameVi);
    await this.titleEn.fill(data.titleEn);
    await this.titleVi.fill(data.titleVi);
    await this.bioShortEn.fill(data.bioShortEn);
    await this.bioShortVi.fill(data.bioShortVi);
  }

  async fillRequiredFields(): Promise<void> {
    await this.fillIdentity({
      fullNameEn: 'E2E Console User',
      fullNameVi: 'Nguoi Dung Console',
      titleEn: 'QA Engineer',
      titleVi: 'Ky Su QA',
      bioShortEn: 'Short bio for console E2E.',
      bioShortVi: 'Tieu su ngan console E2E.',
    });
    await this.email.fill('e2e-console@test-safe.com');
    await this.selectPreferredContactPlatform('LinkedIn');
    await this.preferredContactValue.fill('https://linkedin.com/in/e2e-console');
    await this.locationCountry.fill('Vietnam');
    await this.locationCity.fill('Hanoi');
    await this.selectAvailability('Employed');
  }
}
