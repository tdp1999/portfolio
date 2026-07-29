import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';
import { seedProfile, deleteProfile } from './helpers/db-profile';
import { TEST_USERS } from './data/test-users';
import { MEDIA_ASSET_URL } from './data/test-media';

const ADMIN = TEST_USERS.admin;

/**
 * Resume is a *subsection* of Social Links, not a section of its own. There is no
 * `section#section-resume` and no `[data-locale]` attribute — a row is `.resume-row`,
 * identified by its `.locale-badge`. Every locator lives in `ProfilePage`.
 *
 * Section bodies are gated with `[hidden]` until their tab is selected, so each test
 * calls `profilePage.activate('section-social-links')` before touching anything.
 */
test.describe('Profile Resume Picker', () => {
  /**
   * Guarantee the picker library has at least one *PDF*, without re-uploading per test.
   *
   * Both halves matter. The resume picker opens with `mimeFilter: 'application/pdf'`, so a
   * library full of images still yields an empty grid — hence `mimeTypePrefix`. And the file
   * has to be a real PDF: `FileSecurityScanner` compares magic bytes against the MIME type
   * Playwright infers from the extension, so PNG bytes named `.pdf` are rejected as a
   * security threat and the upload never lands.
   */
  test.beforeEach(async ({ adminPage: page, request }) => {
    // Own the profile row rather than inheriting one.
    //
    // This was the only profile spec that seeded nothing, so whether a row existed depended on
    // which sibling had run last: `profile-avatar-picker` deletes the profile in its `afterAll`,
    // and alphabetical order puts it before this file. The saving test then PATCHed
    // `/admin/profile/social-links` into a `404 PROFILE_NOT_FOUND` and reported it as "the value
    // did not survive a reload" — a persistence bug that was never there.
    await seedProfile(ADMIN.id, ADMIN.email);

    const list = await request.get(
      'http://localhost:3000/api/media/list?page=1&limit=1&mimeTypePrefix=application/pdf'
    );
    const body = list.ok() ? await list.json() : null;
    const hasPdf = (body?.data?.items?.length ?? 0) > 0;
    if (hasPdf) return;

    const mediaPage = new MediaPage(page);
    await mediaPage.goto();
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(MediaPage.createTestPdf('resume-test.pdf'));
    await responsePromise;
  });

  test.afterAll(async () => {
    await deleteProfile(ADMIN.id);
  });

  /** Open the picker from one resume row and pick the first asset. */
  async function pickFirstAsset(profilePage: ProfilePage, locale: 'EN' | 'VI'): Promise<void> {
    await profilePage.resumeChangeButton(locale).click();
    const picker = new MediaPickerPage(profilePage.page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();
    await expect(profilePage.resumeLink(locale)).toHaveCount(1);
  }

  test.describe('Structure', () => {
    test('shows an EN and a VI row, each with a Change button', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      for (const locale of ['EN', 'VI'] as const) {
        await expect(profilePage.resumeRow(locale)).toHaveCount(1);
        await expect(profilePage.resumeChangeButton(locale)).toBeVisible();
      }
    });

    test('an unset row reads "No file selected" and offers no Remove', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      const row = profilePage.resumeRow('VI');
      // Fresh e2e profile has no resume; the remove control is bound to `@if (ctrl.value)`.
      if ((await profilePage.resumeLink('VI').count()) === 0) {
        await expect(row).toContainText('No file selected');
        await expect(profilePage.resumeRemoveButton('VI')).toHaveCount(0);
      }
    });
  });

  test.describe('Selecting a file', () => {
    test('Change opens the picker with a settled, non-empty grid', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      await profilePage.resumeChangeButton('EN').click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      await expect(picker.getGridItems().first()).toBeVisible();
      expect(await picker.getGridItems().count()).toBeGreaterThan(0);
    });

    test('inserting writes the asset URL into the EN row', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      await pickFirstAsset(profilePage, 'EN');

      const href = await profilePage.resumeUrl('EN');
      expect(href).toMatch(MEDIA_ASSET_URL);
    });

    test('Cancel leaves the row untouched', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      const before = await profilePage.resumeUrl('EN');

      await profilePage.resumeChangeButton('EN').click();
      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      await picker.clickCancel();

      expect(await profilePage.resumeUrl('EN')).toBe(before);
    });

    test('Remove clears a set row', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      await pickFirstAsset(profilePage, 'EN');
      await expect(profilePage.resumeRemoveButton('EN')).toBeVisible();

      await profilePage.resumeRemoveButton('EN').click();

      await expect(profilePage.resumeLink('EN')).toHaveCount(0);
      await expect(profilePage.resumeRow('EN')).toContainText('No file selected');
    });
  });

  test.describe('EN and VI are independent', () => {
    test('setting EN leaves VI alone', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      const viBefore = await profilePage.resumeUrl('VI');
      await pickFirstAsset(profilePage, 'EN');

      expect(await profilePage.resumeUrl('EN')).toMatch(MEDIA_ASSET_URL);
      expect(await profilePage.resumeUrl('VI')).toBe(viBefore);
    });

    test('both rows can hold a URL at once', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      await pickFirstAsset(profilePage, 'EN');
      await pickFirstAsset(profilePage, 'VI');

      expect(await profilePage.resumeUrl('EN')).toMatch(MEDIA_ASSET_URL);
      expect(await profilePage.resumeUrl('VI')).toMatch(MEDIA_ASSET_URL);
    });
  });

  test.describe('Saving', () => {
    test('Save section is disabled until something changes', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      // Both resumes are optional, so an untouched section has nothing to save.
      await expect(profilePage.socialLinks.saveButton).toBeDisabled();

      await pickFirstAsset(profilePage, 'EN');
      await expect(profilePage.socialLinks.saveButton).toBeEnabled();
    });

    test('a picked resume survives a reload', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-social-links');

      await pickFirstAsset(profilePage, 'EN');
      const picked = await profilePage.resumeUrl('EN');
      // The real endpoint. `/api/profile` never matched anything, so this waited out its
      // full 30s timeout: resume URLs are persisted by the Social Links section, whose save
      // PATCHes `/admin/profile/social-links`.
      await profilePage.socialLinks.saveSection('/admin/profile/social-links');

      await profilePage.goto();
      await profilePage.activate('section-social-links');

      expect(await profilePage.resumeUrl('EN')).toBe(picked);
    });
  });
});
