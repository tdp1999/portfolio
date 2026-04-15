import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { expectToast } from './helpers/toast';
import { seedProfile, deleteProfile } from './helpers/db-profile';
import { TEST_USERS } from './data/test-users';

const ADMIN = TEST_USERS.admin;

test.describe('Profile — Per-Section Save', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await seedProfile(ADMIN.id, ADMIN.email);
  });

  test.afterAll(async () => {
    await deleteProfile(ADMIN.id);
  });

  // ─── Form Load ────────────────────────────────────────────────────

  test('page loads with 6 section cards and scrollspy rail', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.heading).toBeVisible();

    // 6 section cards
    await expect(profile.identity.root).toBeVisible();
    await expect(profile.workAvailability.root).toBeVisible();
    await expect(profile.contact.root).toBeVisible();
    await expect(profile.location.root).toBeVisible();
    await expect(profile.socialLinks.root).toBeVisible();
    await expect(profile.seoOg.root).toBeVisible();

    // Rail with 6 items
    await expect(profile.rail.nav).toBeVisible();
    await expect(profile.rail.item('Identity')).toBeVisible();
    await expect(profile.rail.item('Contact')).toBeVisible();
    await expect(profile.rail.item('SEO / OG')).toBeVisible();
  });

  test('form prefills with seeded profile data', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.identity.field('Full Name (EN)')).toHaveValue('E2E Admin');
    await expect(profile.identity.field('Full Name (VI)')).toHaveValue('Quản trị E2E');
    await expect(profile.identity.field('Title (EN)')).toHaveValue('QA Engineer');
    await expect(profile.contact.field('Email')).toHaveValue(ADMIN.email);
    await expect(profile.location.field('Country')).toHaveValue('Vietnam');
  });

  // ─── Per-Section Isolation ────────────────────────────────────────

  test('save Identity → only /identity PATCH fires; other sections stay pristine', async ({
    adminPage: page,
    apiRequests,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Edit only Identity
    await profile.identity.field('Full Name (EN)').fill('Updated Name');

    // Other sections' save buttons should be disabled (not dirty)
    await expect(profile.contact.saveButton).toBeDisabled();
    await expect(profile.location.saveButton).toBeDisabled();
    await expect(profile.seoOg.saveButton).toBeDisabled();

    // Save identity
    await profile.identity.save('/api/admin/profile/identity');
    await expectToast(page, 'Identity saved');

    // Verify only identity PATCH was fired
    const patchRequests = apiRequests.filter((r) => r.startsWith('PATCH'));
    expect(patchRequests).toHaveLength(1);
    expect(patchRequests[0]).toContain('/identity');
  });

  test('saved data persists after refresh', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.identity.field('Full Name (EN)')).toHaveValue('Updated Name');
  });

  // ─── Validation — Contact Section ─────────────────────────────────

  test('invalid email → save disabled, inline error in Contact card, rail shows ⚠', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Type an invalid email to trigger validation
    const emailField = profile.contact.field('Email');
    await emailField.fill('not-an-email');
    // Blur the field so Angular validation fires and marks as touched
    await emailField.blur();

    // Save button should be disabled (form is invalid)
    await expect(profile.contact.saveButton).toBeDisabled();

    // Mat-error should appear inside the Contact section (Angular shows mat-error on touched+invalid)
    const matError = profile.contact.root.locator('mat-error');
    await expect(matError.first()).toBeVisible();

    // Rail icon for Contact should be ⚠ (error) — statusFor returns 'error' when invalid+dirty
    await expect(profile.rail.iconFor('Contact')).toHaveText('⚠');

    // Other rail items should NOT show ⚠
    expect.soft(await profile.rail.iconFor('Identity').textContent()).not.toBe('⚠');
    expect.soft(await profile.rail.iconFor('Location').textContent()).not.toBe('⚠');

    // Restore valid email so later serial tests work
    await emailField.fill(ADMIN.email);
  });

  // ─── Unsaved Changes Guard ────────────────────────────────────────

  test('dirty section + nav away → guard dialog: Stay keeps on page', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Make Location dirty
    await profile.location.field('City').fill('Da Nang');

    // Trigger client-side navigation (sidebar is collapsed behind content, use JS click)
    await page.evaluate(() => (document.querySelector('a[routerlink="/skills"]') as HTMLElement)?.click());

    // Guard dialog should appear
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();

    // Click Stay
    await dialog.getByRole('button', { name: 'Stay' }).click();

    // Should still be on /profile
    await expect(page).toHaveURL(/\/profile/);
    // Location field should still have the dirty value
    await expect(profile.location.field('City')).toHaveValue('Da Nang');
  });

  test('dirty section + nav away → guard dialog: Discard navigates away', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Make Location dirty
    await profile.location.field('City').fill('Da Nang');

    // Trigger client-side navigation (sidebar is collapsed behind content, use JS click)
    await page.evaluate(() => (document.querySelector('a[routerlink="/skills"]') as HTMLElement)?.click());

    // Guard dialog
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Click Discard
    await dialog.getByRole('button', { name: 'Discard' }).click();

    // Should navigate away from profile
    await expect(page).not.toHaveURL(/\/profile/);
  });

  // ─── Scrollspy — Rail Active State ────────────────────────────────

  test('clicking rail item scrolls into view and updates URL fragment', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Click "SEO / OG" in the rail
    await profile.rail.item('SEO / OG').click();

    // URL should have #section-seo-og fragment
    await expect(page).toHaveURL(/#section-seo-og/);

    // The SEO/OG section should be visible in viewport
    await expect(profile.seoOg.root).toBeInViewport();
  });

  test('deep-link with fragment loads at correct section', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.gotoWithFragment('section-location');

    // Wait for scroll to settle
    await page.waitForTimeout(500);

    // Location section should be visible
    await expect(profile.location.root).toBeInViewport();
  });

  // ─── Social Links & Certifications (via per-section save) ─────────

  test('add social link → save Social Links section → verify via admin API', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await profile.addSocialLink('GitHub', 'https://github.com/e2e-per-section');
    await profile.socialLinks.save('/api/admin/profile/social-links');
    await expectToast(page, 'Social Links saved');

    // Verify persisted data by refreshing the page and checking the form
    await profile.goto();
    // The new link should appear in the Social Links section
    const lastLinkUrl = profile.socialLinks.root.locator('.social-link-row').last().getByLabel('URL');
    await expect(lastLinkUrl).toHaveValue('https://github.com/e2e-per-section');
  });

  test('add certification → save Social Links section → verify persists', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await profile.addCertification('PW Expert', 'E2E Corp', 2026);
    await profile.socialLinks.save('/api/admin/profile/social-links');
    await expectToast(page, 'Social Links saved');

    // Verify by refreshing
    await profile.goto();
    const lastCertName = profile.socialLinks.root.locator('.cert-row').last().getByLabel('Name');
    await expect(lastCertName).toHaveValue('PW Expert');
  });
});
