import { test, expect } from './fixtures/auth.fixture';
import { ConsoleShell } from './pages/console-shell.page';
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

  test('show-all mode renders every section card alongside the tab rail', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.gotoAllSections();

    await expect(profile.heading).toBeVisible();

    // 6 section cards
    await expect(profile.identity.root).toBeVisible();
    await expect(profile.workAvailability.root).toBeVisible();
    await expect(profile.contact.root).toBeVisible();
    await expect(profile.location.root).toBeVisible();
    await expect(profile.socialLinks.root).toBeVisible();
    await expect(profile.seoOg.root).toBeVisible();

    // Tab rail stays visible in show-all mode and keeps one item per section
    await expect(profile.rail.nav).toBeVisible();
    await expect(profile.rail.item('Identity')).toBeVisible();
    await expect(profile.rail.item('Contact')).toBeVisible();
    await expect(profile.rail.item('SEO / OG')).toBeVisible();
  });

  test('form prefills with seeded profile data', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.gotoAllSections();

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
    // Show-all so the untouched sections are genuinely on screen while we assert
    // that editing one of them left the others alone.
    await profile.gotoAllSections();

    // Edit only Identity
    await profile.identity.field('Full Name (EN)').fill('Updated Name');

    // Other sections' save buttons should be disabled (not dirty)
    await expect(profile.contact.saveButton).toBeDisabled();
    await expect(profile.location.saveButton).toBeDisabled();
    await expect(profile.seoOg.saveButton).toBeDisabled();

    // Save identity
    await profile.identity.saveSection('/api/admin/profile/identity');
    await expectToast(page, 'Identity saved');

    // Verify only identity PATCH was fired
    const patchRequests = apiRequests.filter((r) => r.startsWith('PATCH'));
    expect(patchRequests).toHaveLength(1);
    expect(patchRequests[0]).toContain('/identity');
  });

  test('saved data persists after refresh', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.gotoAllSections();

    await expect(profile.identity.field('Full Name (EN)')).toHaveValue('Updated Name');
  });

  // ─── Validation — Contact Section ─────────────────────────────────

  test('invalid email → save disabled, inline error in Contact card, rail shows ⚠', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-contact');

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
  //
  // `/profile` declares `canDeactivate: [unsavedChangesGuard]`, and the guard returns early unless
  // `component.hasUnsavedChanges()` reports true. `Profile.isDirty` aggregates the eight sections'
  // own `dirty` signals, so a dirty *section* makes the *page* dirty. There is no
  // `onSaveAndContinue`, so the dialog offers Stay and Discard only.
  //
  // The dialog is `disableClose: true` and resolves to `false` on dismissal, so Stay is also what
  // an Escape press or a backdrop click amounts to.

  test('dirty section + nav away → guard dialog: Stay keeps on page', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-location');

    await profile.location.field('City').fill('Da Nang');

    // A real in-app navigation, which is what triggers `canDeactivate`. By route, not by label —
    // every sidebar entry's accessible name starts with its `mat-icon` ligature text.
    await new ConsoleShell(page).navLinkByRoute('/skills').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('heading', { name: 'Unsaved Changes' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Stay' }).click();

    await expect(page).toHaveURL(/\/profile/);
    // The edit survives, which is the whole point of Stay.
    await expect(profile.location.field('City')).toHaveValue('Da Nang');

    // No cleanup needed even though this describe is serial: `adminPage` builds on Playwright's
    // `page` fixture, which is test-scoped, so the dirty form dies with this test's page.
  });

  test('dirty section + nav away → guard dialog: Discard navigates away', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-location');

    await profile.location.field('City').fill('Da Nang');

    await new ConsoleShell(page).navLinkByRoute('/skills').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await dialog.getByRole('button', { name: 'Discard' }).click();

    await expect(page).toHaveURL(/\/skills/);
  });

  test('clean page navigates away with no dialog at all', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-location');

    // Nothing typed, so the guard must not interrupt. Without this the two tests above would
    // still pass against a guard that prompts unconditionally.
    await new ConsoleShell(page).navLinkByRoute('/skills').click();

    await expect(page).toHaveURL(/\/skills/);
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  // ─── Tab rail — active state and fragment sync ────────────────────
  //
  // The rail is a tab switcher, not a scrollspy: selecting an item swaps which section
  // body is un-hidden rather than scrolling a long page. `section-tabs.ts` still mirrors
  // the active id into the URL fragment, so deep-linking keeps working.

  test('clicking a rail item reveals its section and updates the URL fragment', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await profile.rail.item('SEO / OG').click();

    await expect(page).toHaveURL(/#section-seo-og/);
    await expect(profile.seoOg.root).toBeVisible();
    await profile.rail.expectActive('SEO / OG');

    // Switching tabs hides the previously active section.
    await expect(profile.identity.root).toBeHidden();
  });

  test('deep-link with fragment loads at correct section', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.gotoWithFragment('section-location');

    await expect(profile.location.root).toBeVisible();
    await profile.rail.expectActive('Location');
  });

  // ─── Social Links & Certifications (via per-section save) ─────────

  test('add social link → save Social Links section → verify via admin API', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-social-links');

    await profile.addSocialLink('GitHub', 'https://github.com/e2e-per-section');
    await profile.socialLinks.saveSection('/api/admin/profile/social-links');
    await expectToast(page, 'Social Links saved');

    // Verify persisted data by refreshing the page and checking the form
    await profile.goto();
    await profile.activate('section-social-links');
    // The new link should appear in the Social Links section
    const lastLinkUrl = profile.socialLinks.root.locator('.social-link-row').last().getByLabel('URL');
    await expect(lastLinkUrl).toHaveValue('https://github.com/e2e-per-section');
  });

  test('add certification → save Social Links section → verify persists', async ({ adminPage: page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.activate('section-social-links');

    await profile.addCertification('PW Expert', 'E2E Corp', 2026);
    await profile.socialLinks.saveSection('/api/admin/profile/social-links');
    await expectToast(page, 'Social Links saved');

    // Verify by refreshing
    await profile.goto();
    await profile.activate('section-social-links');
    const lastCertName = profile.socialLinks.root.locator('.cert-row').last().getByLabel('Name');
    await expect(lastCertName).toHaveValue('PW Expert');
  });
});
