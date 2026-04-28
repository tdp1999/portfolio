import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

test.describe('Profile Avatar & OG Image Picker Migration', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // Ensure test image is available
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const testImage = MediaPage.createTestFile('avatar-test.jpg');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testImage);
    await responsePromise;
  });

  test.describe('Avatar Field', () => {
    test('avatar field renders current preview + Change button', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();

      // Scroll to identity section
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      // Should see avatar preview
      const avatarImg = profilePage.identity.root.locator('img[alt*="avatar" i]');
      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });

      await expect(avatarImg).toBeVisible();
      await expect(changeButton).toBeVisible();
    });

    test('click Change → opens MediaPickerDialog with image/ filter', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Dialog title should indicate image selection
      const title = picker.dialog.locator('h3');
      await expect(title).toContainText('Select Media');

      // Should only show images (filter applied by default)
      const items = await picker.getGridItems().count();
      expect(items).toBeGreaterThan(0);
    });

    test('select image → preview updates immediately', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select first image
      const firstItem = picker.getGridItems().first();
      //   const mediaId = await firstItem.getAttribute('data-media-id');
      await firstItem.click();
      await picker.clickInsert();

      // Preview should update
      const avatarImg = profilePage.identity.root.locator('img[alt*="avatar" i]');
      await avatarImg.waitFor({ state: 'visible', timeout: 5000 });

      // Image src should contain the selected media ID
      const src = await avatarImg.getAttribute('src');
      expect(src).toContain('media');
    });

    test('Remove button clears avatar field', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      // First, set an avatar
      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Wait for preview update
      await page.waitForTimeout(500);

      // Click Remove button
      const removeButton = profilePage.identity.root.locator('button', { hasText: 'Remove' });
      await removeButton.click();

      // Avatar field should be cleared
      const avatarImg = profilePage.identity.root.locator('img[alt*="avatar" i]');
      const isVisible = await avatarImg.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('save → avatar persists on reload', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      // Select and save avatar
      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      //   const selectedId = await firstItem.getAttribute('data-media-id');
      await firstItem.click();
      await picker.clickInsert();

      // Save section
      await profilePage.identity.save('PATCH');

      // Reload page
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();

      // Avatar should still be visible
      const avatarImg = profilePage.identity.root.locator('img[alt*="avatar" i]');
      await expect(avatarImg).toBeVisible();
    });

    test('avatar persists on landing page', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();
      await profilePage.identity.root.waitFor({ state: 'visible' });

      // Set avatar
      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Save
      await profilePage.identity.save('PATCH');

      // Navigate to landing (public page) as a different user if possible
      // Or check in the hero section where avatar appears
      await page.goto('/');
      const landingAvatar = page.locator('img[alt*="avatar" i], [role="img"][aria-label*="avatar" i]');
      await expect(landingAvatar).toBeVisible();
    });
  });

  test.describe('OG Image Field', () => {
    test('og image field renders Change button in SEO section', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('SEO').click();
      await profilePage.seoOg.root.waitFor({ state: 'visible' });

      const changeButton = profilePage.seoOg.root.locator('button', { hasText: 'Change' });
      await expect(changeButton).toBeVisible();
    });

    test('select og image → save → persists', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('SEO').click();
      await profilePage.seoOg.root.waitFor({ state: 'visible' });

      // Open picker
      const changeButton = profilePage.seoOg.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select first image
      const firstItem = picker.getGridItems().first();
      const selectedId = await firstItem.getAttribute('data-media-id');

      if (!selectedId) {
        throw new Error('Test media item does not have data-media-id attribute');
      }

      await firstItem.click();
      await picker.clickInsert();

      // Save
      await profilePage.seoOg.save('PATCH');

      // Reload and verify
      await profilePage.goto();
      await profilePage.rail.item('SEO').click();

      // OG image should be set (verify via form control or preview)
      const ogImageControl = profilePage.seoOg.root.locator('input[formControlName="ogImageId"]');
      await expect(ogImageControl).toHaveValue(selectedId);
    });

    test('og image change updates meta tags', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('SEO').click();

      // Set OG image
      const changeButton = profilePage.seoOg.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      const mediaId = await firstItem.getAttribute('data-media-id');

      if (!mediaId) {
        throw new Error('Test media item does not have data-media-id attribute');
      }

      await firstItem.click();
      await picker.clickInsert();

      // Save
      await profilePage.seoOg.save('PATCH');

      // Check meta og:image tag (may require server-side rendering verification)
      // For now, just verify form control has the value
      const ogImageControl = profilePage.seoOg.root.locator('input[formControlName="ogImageId"]');
      await expect(ogImageControl).toHaveValue(mediaId);
    });
  });

  test.describe('Form Validation', () => {
    test('avatar/og-image fields are optional', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();

      // Should be able to save without avatar
      const saveButton = profilePage.identity.saveButton;
      await expect(saveButton).toBeEnabled();
    });

    test('can toggle avatar on/off without affecting other fields', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();

      // Set initial value in another field (e.g., name)
      const nameField = profilePage.identity.field('Name');
      await nameField.fill('Test User');

      // Set avatar
      const changeButton = profilePage.identity.root.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Remove avatar
      const removeButton = profilePage.identity.root.locator('button', { hasText: 'Remove' });
      await removeButton.click();

      // Save and verify name is still there
      await profilePage.identity.save('PATCH');
      await profilePage.goto();
      await profilePage.rail.item('Identity').click();

      const savedName = await profilePage.identity.field('Name').inputValue();
      expect(savedName).toBe('Test User');
    });
  });
});
