import { type Page } from '@playwright/test';
import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';
import { seedProfile, deleteProfile } from './helpers/db-profile';
import { TEST_USERS } from './data/test-users';

const ADMIN = TEST_USERS.admin;

/**
 * Certifications are a *subsection* of Social Links, exactly like Resume: there is no
 * `section#section-certifications` and no `/profile#certifications` fragment. Rows are
 * `.cert-row`, not `[role="group"]`, and every locator lives in `ProfilePage`.
 *
 * The behaviour worth pinning down is that `mode` is a pure UI concept. `save()` strips it
 * from the payload (`({ mode: _mode, ...c })`) and the section re-derives it on load with
 * `inferCertMode(url)` — a `res.cloudinary.com` URL comes back as File, anything else as
 * Link. So "the mode persisted" really means "the URL shape still implies the same mode".
 */
test.describe('Profile Certification Picker', () => {
  test.afterAll(async () => {
    await deleteProfile(ADMIN.id);
  });

  test.beforeEach(async ({ adminPage: page, request }) => {
    // Per test, not per file: several tests here save certifications, and `seedProfile` resets
    // `certifications: []` on an existing row. Without the reset, "starts empty" and every
    // `certRows().first()` would see whatever the previous test persisted.
    await seedProfile(ADMIN.id, ADMIN.email);

    // The cert picker opens with `mimeFilter: 'application/pdf'`, so images in the library do
    // not help — and the fixture must be a genuine PDF, because `FileSecurityScanner` compares
    // magic bytes against the MIME type Playwright infers from the extension.
    const list = await request.get(
      'http://localhost:3000/api/media/list?page=1&limit=1&mimeTypePrefix=application/pdf'
    );
    const body = list.ok() ? await list.json() : null;
    if ((body?.data?.items?.length ?? 0) > 0) return;

    const mediaPage = new MediaPage(page);
    await mediaPage.goto();
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(MediaPage.createTestPdf('cert-test.pdf'));
    await responsePromise;
  });

  /** Land on Social Links with a clean certifications array. */
  async function openCertifications(page: Page): Promise<ProfilePage> {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.activate('section-social-links');
    return profilePage;
  }

  // ─── Row structure ───────────────────────────────────────────────

  test('starts empty and adds a row on demand', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);

    await expect(profilePage.certEmptyState()).toBeVisible();
    await expect(profilePage.certRows()).toHaveCount(0);

    await profilePage.addCertificationButton().click();

    await expect(profilePage.certRows()).toHaveCount(1);
    await expect(profilePage.certEmptyState()).toBeHidden();
  });

  test('a row carries name, issuer, year and a mode toggle', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertificationButton().click();

    const row = profilePage.certRows().first();
    await expect(row.getByLabel('Name')).toBeVisible();
    await expect(row.getByLabel('Issuer')).toBeVisible();
    await expect(row.getByLabel('Year')).toBeVisible();
    await expect(profilePage.certificationModeChip(row, 'Link')).toBeVisible();
    await expect(profilePage.certificationModeChip(row, 'File')).toBeVisible();
  });

  test('year is pre-seeded with the current year', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertificationButton().click();

    const row = profilePage.certRows().first();
    await expect(row.getByLabel('Year')).toHaveValue(String(new Date().getFullYear()));
  });

  test('remove drops the row and restores the empty state', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertificationButton().click();
    await expect(profilePage.certRows()).toHaveCount(1);

    await profilePage.certificationRemoveButton(profilePage.certRows().first()).click();

    await expect(profilePage.certRows()).toHaveCount(0);
    await expect(profilePage.certEmptyState()).toBeVisible();
  });

  // ─── Link mode (default) ─────────────────────────────────────────

  test('a new row starts in Link mode with a URL text field', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertificationButton().click();

    const row = profilePage.certRows().first();
    await profilePage.expectCertificationMode(row, 'Link');
    await expect(profilePage.certificationUrlInput(row)).toBeVisible();
    await expect(profilePage.certificationChooseFileButton(row)).toHaveCount(0);
  });

  test('Link mode accepts an external credential URL', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('AWS Solutions Architect', 'Amazon Web Services', 2023);

    const row = profilePage.certRows().first();
    await profilePage.certificationUrlInput(row).fill('https://www.credly.com/badges/example');

    await expect(profilePage.certificationUrlInput(row)).toHaveValue('https://www.credly.com/badges/example');
  });

  // ─── File mode ───────────────────────────────────────────────────

  test('switching to File mode swaps the text field for a Choose file trigger', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertificationButton().click();

    const row = profilePage.certRows().first();
    await profilePage.setCertificationMode(row, 'File');

    await profilePage.expectCertificationMode(row, 'File');
    await expect(profilePage.certificationChooseFileButton(row)).toBeVisible();
    await expect(profilePage.certificationUrlInput(row)).toHaveCount(0);
    await expect(row.getByText('No file selected')).toBeVisible();
  });

  test('picking a PDF renders the file link', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('GCP Professional Architect', 'Google Cloud', 2024);

    const row = profilePage.certRows().first();
    await profilePage.setCertificationMode(row, 'File');
    await profilePage.certificationChooseFileButton(row).click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await expect(picker.getGridItems().first()).toBeVisible();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    await expect(profilePage.certificationFileLink(row)).toHaveCount(1);
    await expect(profilePage.certificationFileLink(row)).toHaveAttribute('href', /res\.cloudinary\.com/);
  });

  test('switching back to Link mode exposes the picked URL as text', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('Terraform Associate', 'HashiCorp', 2024);

    const row = profilePage.certRows().first();
    await profilePage.setCertificationMode(row, 'File');
    await profilePage.certificationChooseFileButton(row).click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    const pickedHref = await profilePage.certificationFileLink(row).getAttribute('href');

    // Mode only decides which widget renders; both read and write the same `url` control.
    await profilePage.setCertificationMode(row, 'Link');
    await expect(profilePage.certificationUrlInput(row)).toHaveValue(pickedHref as string);
  });

  // ─── Persistence ─────────────────────────────────────────────────

  test('a Link-mode cert round-trips and reloads in Link mode', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('Google Cloud Certified', 'Google Cloud', 2023);

    const row = profilePage.certRows().first();
    await profilePage.certificationUrlInput(row).fill('https://www.credly.com/google-cert');
    await profilePage.socialLinks.saveSection('/admin/profile/social-links');

    await profilePage.goto();
    await profilePage.activate('section-social-links');

    const reloaded = profilePage.certRows().first();
    await expect(reloaded.getByLabel('Name')).toHaveValue('Google Cloud Certified');
    await expect(reloaded.getByLabel('Issuer')).toHaveValue('Google Cloud');
    // `inferCertMode` sees a non-Cloudinary URL and resolves to Link.
    await profilePage.expectCertificationMode(reloaded, 'Link');
    await expect(profilePage.certificationUrlInput(reloaded)).toHaveValue('https://www.credly.com/google-cert');
  });

  test('a File-mode cert round-trips and reloads in File mode', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('AWS Security Specialty', 'Amazon Web Services', 2025);

    const row = profilePage.certRows().first();
    await profilePage.setCertificationMode(row, 'File');
    await profilePage.certificationChooseFileButton(row).click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();
    const pickedHref = await profilePage.certificationFileLink(row).getAttribute('href');

    await profilePage.socialLinks.saveSection('/admin/profile/social-links');

    await profilePage.goto();
    await profilePage.activate('section-social-links');

    const reloaded = profilePage.certRows().first();
    // The saved payload carries no `mode`; File is re-derived purely from the Cloudinary URL.
    await profilePage.expectCertificationMode(reloaded, 'File');
    await expect(profilePage.certificationFileLink(reloaded)).toHaveAttribute('href', pickedHref as string);
  });

  test('mixed Link and File certs both survive a reload', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);

    await profilePage.addCertification('AWS Cert', 'Amazon Web Services', 2023);
    const linkRow = profilePage.certRows().nth(0);
    await profilePage.certificationUrlInput(linkRow).fill('https://www.credly.com/aws');

    await profilePage.addCertification('GCP Cert', 'Google Cloud', 2024);
    const fileRow = profilePage.certRows().nth(1);
    await profilePage.setCertificationMode(fileRow, 'File');
    await profilePage.certificationChooseFileButton(fileRow).click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    await profilePage.socialLinks.saveSection('/admin/profile/social-links');

    await profilePage.goto();
    await profilePage.activate('section-social-links');

    await expect(profilePage.certRows()).toHaveCount(2);
    await profilePage.expectCertificationMode(profilePage.certRows().nth(0), 'Link');
    await profilePage.expectCertificationMode(profilePage.certRows().nth(1), 'File');
  });

  // ─── Validation ──────────────────────────────────────────────────

  test('name and issuer are required — clearing one blocks the save', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);

    // `isSaveDisabled()` is `invalid || !dirty || saving`, so a complete row must enable Save
    // before clearing a field can be shown to disable it again. The old spec claimed the
    // opposite ("all fields are optional") and asserted an enabled button on a pristine form,
    // which is disabled for an entirely different reason.
    await profilePage.addCertification('Kubernetes Administrator', 'CNCF', 2024);
    await expect(profilePage.socialLinks.saveButton).toBeEnabled();

    const row = profilePage.certRows().first();
    await row.getByLabel('Name').clear();
    await expect(profilePage.socialLinks.saveButton).toBeDisabled();

    await row.getByLabel('Name').fill('Kubernetes Administrator');
    await expect(profilePage.socialLinks.saveButton).toBeEnabled();

    await row.getByLabel('Issuer').clear();
    await expect(profilePage.socialLinks.saveButton).toBeDisabled();
  });

  test('a malformed URL blocks the save in Link mode', async ({ adminPage: page }) => {
    const profilePage = await openCertifications(page);
    await profilePage.addCertification('Azure Solutions Architect', 'Microsoft', 2024);
    await expect(profilePage.socialLinks.saveButton).toBeEnabled();

    // `baselineFor.url()` is pattern + max length, not required — an empty URL is fine, a
    // non-http(s) string is not.
    const row = profilePage.certRows().first();
    await profilePage.certificationUrlInput(row).fill('not-a-url');

    await expect(profilePage.socialLinks.saveButton).toBeDisabled();
  });
});
