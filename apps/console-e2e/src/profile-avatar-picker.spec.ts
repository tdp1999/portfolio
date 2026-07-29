import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';
import { seedProfile, deleteProfile } from './helpers/db-profile';
import { TEST_USERS } from './data/test-users';
import { expectToast } from './helpers/toast';

const ADMIN = TEST_USERS.admin;

/**
 * Avatar and OG image are **not** fields of the Identity / SEO forms.
 *
 * Both are signals that persist the instant the picker closes — `openAvatarPicker()` calls
 * `PATCH /admin/profile/avatar`, `openOgImagePicker()` calls `PATCH /admin/profile/og-image` —
 * which is why the Identity card's subtitle reads "Avatar saves on upload". The previous version
 * of this file clicked "Save section" after every pick and burned four 30s timeouts on a button
 * that is `disabled` precisely because the form never became dirty. `ProfilePage.pickAvatar()`
 * and `pickOgImage()` encode the real contract: pick, then wait for that PATCH.
 *
 * Two further corrections, both cases of a test that could not pass rather than of drift:
 *
 * - The old opening test asserted a preview `<img>` was visible on a profile that `seedProfile`
 *   creates with `avatarId: null`, so the template was rendering its `@else` placeholder. It now
 *   asserts the empty state first and the preview only after a pick.
 * - Two OG tests called `toHaveValue()` on the preview `<img>`. `toHaveValue` only applies to
 *   form controls, and there is no input to read — `ogImageId` is a signal. They now assert the
 *   `<img src>` against the URL the PATCH returned, which is what proves the round-trip.
 */
test.describe('Profile Avatar & OG Image Picker', () => {
  // `global-setup` seeds the admin *user* but no profile row, and
  // `PATCH /api/admin/profile/avatar` writes with `prisma.profile.update({ where: { userId } })`.
  // Without a row that request now returns a shaped 404 (it used to leak a P2025 as a 500),
  // so every test here would still die on setup rather than on its own assertion.
  //
  // Re-seeded per test, not once: each test persists an avatar or OG image straight to the row,
  // so a shared profile would carry the previous test's state into the next one.
  test.beforeEach(async ({ adminPage: page }) => {
    await seedProfile(ADMIN.id, ADMIN.email);

    // Guarantee the picker has something to pick.
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    // `.png`, not `.jpg`: the fixture bytes are PNG and the scanner rejects a MIME mismatch.
    const testImage = MediaPage.createTestFile('avatar-test.png');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testImage);
    await responsePromise;
  });

  test.afterAll(async () => {
    await deleteProfile(ADMIN.id);
  });

  test.describe('Avatar Field', () => {
    test('with no avatar set, the trigger is there and the preview is not', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      await expect(profilePage.avatarTrigger).toBeVisible();
      // `@else` branch: a `.media-default` placeholder, no `<img>`, and no way to remove nothing.
      await expect(profilePage.avatarPreview).toHaveCount(0);
      await expect(profilePage.avatarRemoveButton).toHaveCount(0);
    });

    test('click Change → opens MediaPickerDialog with image/ filter', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      await profilePage.avatarTrigger.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      await expect(picker.dialog.locator('h3')).toContainText('Select Media');
      expect(await picker.getGridItems().count()).toBeGreaterThan(0);
    });

    test('picking an image persists it and shows the preview', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      const avatarUrl = await profilePage.pickAvatar();

      await expectToast(page, 'Avatar updated');
      await expect(profilePage.avatarPreview).toBeVisible();
      // Against the URL the endpoint itself returned. `UpdateAvatarHandler` answers with
      // `media.url`, a storage path that does not embed the media id — so matching `src` against
      // the id looks reasonable and can never succeed.
      await expect(profilePage.avatarPreview).toHaveAttribute('src', avatarUrl);
    });

    test('Remove clears the avatar after confirming', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      await profilePage.pickAvatar();
      await expect(profilePage.avatarPreview).toBeVisible();

      // Remove is guarded by a "Remove Avatar" confirmation; clicking the button alone does
      // nothing at all, which the old assertion (`isVisible().catch(() => false)`) could not tell
      // apart from a successful clear.
      await profilePage.removeAvatar();

      await expect(profilePage.avatarPreview).toHaveCount(0);
      await expect(profilePage.avatarRemoveButton).toHaveCount(0);
    });

    test('a picked avatar survives a reload', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      const avatarUrl = await profilePage.pickAvatar();

      await profilePage.goto();
      await profilePage.activate('section-identity');

      await expect(profilePage.avatarPreview).toBeVisible();
      await expect(profilePage.avatarPreview).toHaveAttribute('src', avatarUrl);
    });
  });

  test.describe('OG Image Field', () => {
    test('og image field renders Change button in SEO section', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-seo-og');

      await expect(profilePage.ogImageTrigger).toBeVisible();
    });

    test('a picked og image survives a reload', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-seo-og');

      const ogImageUrl = await profilePage.pickOgImage();
      await expect(profilePage.ogImagePreview).toBeVisible();

      await profilePage.goto();
      await profilePage.activate('section-seo-og');

      await expect(profilePage.ogImagePreview).toHaveAttribute('src', ogImageUrl);
    });
  });

  test.describe('Independence from the Identity form', () => {
    test('picking then removing an avatar leaves the text fields alone', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.activate('section-identity');

      // Full label, including the locale suffix: `console-translatable-group` renders both
      // "Full Name (EN)" and "Full Name (VI)", so `field('Name')` matches two controls.
      const nameField = profilePage.identity.field('Full Name (EN)');
      await nameField.fill('Avatar Test User');

      await profilePage.pickAvatar();
      await profilePage.removeAvatar();

      // The avatar round-trip must not have reset the form, and the section save is still the
      // thing that persists text — the avatar PATCHes never touch these columns.
      await expect(nameField).toHaveValue('Avatar Test User');

      await profilePage.identity.saveSection('/admin/profile/identity');
      await profilePage.goto();
      await profilePage.activate('section-identity');

      await expect(profilePage.identity.field('Full Name (EN)')).toHaveValue('Avatar Test User');
    });
  });
});
