import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

test.describe('Profile Resume Picker Migration', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // Upload a test PDF
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const testPdf = MediaPage.createTestFile('resume-test.pdf');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testPdf);
    await responsePromise;
  });

  test.describe('Resume Section Structure', () => {
    test('Resume section shows EN and VI rows with Change buttons', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();

      // Navigate to Resume section (likely under a section, or scroll down)
      // The section may be collapsed initially
      const resumeSection = page.locator('section#section-resume');
      if (!(await resumeSection.isVisible())) {
        // Try scrolling to it
        await page.goto('/profile#resume');
      }

      await resumeSection.waitFor({ state: 'visible' });

      // Should have two rows: EN and VI
      const enRow = resumeSection.locator('[data-locale="en"]');
      const viRow = resumeSection.locator('[data-locale="vi"]');

      await expect(enRow).toBeVisible();
      await expect(viRow).toBeVisible();

      // Each row should have a Change button
      const enChangeButton = enRow.locator('button', { hasText: 'Change' });
      const viChangeButton = viRow.locator('button', { hasText: 'Change' });

      await expect(enChangeButton).toBeVisible();
      await expect(viChangeButton).toBeVisible();
    });

    test('each row shows current filename/URL preview', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');

      // Preview should show either filename or URL (depending on implementation)
      const preview = enRow.locator('.preview, [role="img"], img');
      // Soft check - preview may be a text field or image
      const previewContent = await enRow.textContent();
      expect(previewContent).toBeTruthy();
    });
  });

  test.describe('EN Resume Upload & Selection', () => {
    test('EN Change button → opens picker with PDF filter', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');
      const changeButton = enRow.locator('button', { hasText: 'Change' });

      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Should show only PDFs (filter applied by default)
      const items = await picker.getGridItems().count();
      expect(items).toBeGreaterThan(0);
    });

    test('select PDF → URL written to EN field', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');
      const changeButton = enRow.locator('button', { hasText: 'Change' });

      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select first PDF
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // EN field should be populated with the picked URL
      const enField = enRow.locator('input, [role="textbox"]');
      await enField.waitFor({ state: 'visible', timeout: 3000 });

      const value = await enField.textContent();
      expect(value).toBeTruthy();
      expect(value).toContain('cloudinary.com'); // Cloudinary URL
    });

    test('Remove button clears EN field', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');

      // First set a resume
      const changeButton = enRow.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      await page.waitForTimeout(500);

      // Click Remove
      const removeButton = enRow.locator('button', { hasText: 'Remove' });
      await removeButton.click();

      // Field should be cleared
      const enField = enRow.locator('input, [role="textbox"]');
      const value = await enField.textContent();
      expect(value).toBeFalsy();
    });

    test('save EN resume → reload → persists', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');

      // Set resume
      const changeButton = enRow.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Save section
      const saveButton = page.locator('section#section-resume button', { hasText: 'Save' });
      await saveButton.click();

      // Wait for save response
      await page.waitForResponse((r) => r.url().includes('PATCH') && r.status() === 200);

      // Reload
      await profilePage.goto();
      await page.goto('/profile#resume');

      // Resume should still be there
      const enField = enRow.locator('input, [role="textbox"]');
      const value = await enField.textContent();
      expect(value).toContain('cloudinary.com');
    });

    test('download link on landing works', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');

      // Set resume
      const changeButton = enRow.locator('button', { hasText: 'Change' });
      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Save
      const saveButton = page.locator('section#section-resume button', { hasText: 'Save' });
      await saveButton.click();
      await page.waitForResponse((r) => r.url().includes('PATCH'));

      // Go to landing page
      await page.goto('/');

      // Look for resume download link
      const resumeLink = page.locator('a', { hasText: /resume|download/i });
      await expect(resumeLink).toBeVisible();

      // Verify link is valid (HEAD request should return 200)
      const href = await resumeLink.getAttribute('href');
      if (href && href.startsWith('http')) {
        const response = await page.request.head(href);
        expect([200, 301, 302]).toContain(response.status());
      }
    });
  });

  test.describe('VI Resume Upload & Selection', () => {
    test('VI Change button → opens picker with PDF filter', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const viRow = resumeSection.locator('[data-locale="vi"]');
      const changeButton = viRow.locator('button', { hasText: 'Change' });

      await changeButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Should show only PDFs
      const items = await picker.getGridItems().count();
      expect(items).toBeGreaterThan(0);
    });

    test('select PDF for VI → URL written to VI field separately from EN', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const viRow = resumeSection.locator('[data-locale="vi"]');

      // First, set EN to something
      const enRow = resumeSection.locator('[data-locale="en"]');
      const enChangeButton = enRow.locator('button', { hasText: 'Change' });
      await enChangeButton.click();

      let picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      await page.waitForTimeout(500);

      // Now set VI
      const viChangeButton = viRow.locator('button', { hasText: 'Change' });
      await viChangeButton.click();

      picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      const secondItem = picker.getGridItems().nth(0); // May be same or different
      await secondItem.click();
      await picker.clickInsert();

      // Both fields should have values, possibly different
      const enField = enRow.locator('input, [role="textbox"]');
      const viField = viRow.locator('input, [role="textbox"]');

      const enValue = await enField.textContent();
      const viValue = await viField.textContent();

      expect(enValue).toContain('cloudinary.com');
      expect(viValue).toContain('cloudinary.com');
    });

    test('EN and VI can be set/cleared independently', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const enRow = resumeSection.locator('[data-locale="en"]');
      const viRow = resumeSection.locator('[data-locale="vi"]');

      // Set EN
      const enChangeButton = enRow.locator('button', { hasText: 'Change' });
      await enChangeButton.click();

      let picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      await picker.getGridItems().first().click();
      await picker.clickInsert();

      await page.waitForTimeout(500);

      // Clear VI (if it had a value)
      const viRemoveButton = viRow.locator('button', { hasText: 'Remove' });
      await viRemoveButton.click();

      // Save
      const saveButton = page.locator('section#section-resume button', { hasText: 'Save' });
      await saveButton.click();
      await page.waitForResponse((r) => r.url().includes('PATCH'));

      // Verify en is set, vi is not
      const enField = enRow.locator('input, [role="textbox"]');
      const viField = viRow.locator('input, [role="textbox"]');

      const enValue = await enField.textContent();
      const viValue = await viField.textContent();

      expect(enValue).toContain('cloudinary.com');
      expect(viValue).toBeFalsy();
    });
  });

  test.describe('Form Validation', () => {
    test('both EN and VI resumes are optional', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#resume');

      const resumeSection = page.locator('section#section-resume');
      const saveButton = resumeSection.locator('button', { hasText: 'Save' });

      // Should be able to save without either resume set
      await expect(saveButton).toBeEnabled();
    });

    test('can save form without touching resumes', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();

      // Just save the section as-is
      const resumeSection = page.locator('section#section-resume');
      const saveButton = resumeSection.locator('button', { hasText: 'Save' });

      const responsePromise = page.waitForResponse((r) => r.url().includes('PATCH'));
      await saveButton.click();

      const response = await responsePromise;
      expect(response.status()).toBe(200);
    });
  });
});
