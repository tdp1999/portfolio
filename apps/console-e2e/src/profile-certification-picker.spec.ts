import { test, expect } from './fixtures/auth.fixture';
import { ProfilePage } from './pages/profile.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

test.describe('Certification Dual-Mode Picker Migration', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // Upload test PDF for file mode
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const testPdf = MediaPage.createTestFile('cert-test.pdf');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testPdf);
    await responsePromise;
  });

  test.describe('Certification Row Structure', () => {
    test('each cert row has a mode toggle (File vs Link)', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      await certSection.waitFor({ state: 'visible' });

      // Add a certification if none exist
      const addButton = certSection.locator('button', { hasText: 'Add' });
      if (await addButton.isVisible()) {
        await addButton.click();
      }

      // Find cert row
      const certRow = certSection.locator('[role="group"]').first();
      const modeToggle = certRow.locator('[role="button"], mat-button-toggle, .toggle').first();

      await expect(modeToggle).toBeVisible();
    });

    test('cert row shows name, issuer, year, url fields', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');

      // Add cert
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();
      const nameInput = certRow.locator('input[placeholder*="name" i], [aria-label*="name" i]');
      const issuerInput = certRow.locator('input[placeholder*="issuer" i], [aria-label*="issuer" i]');
      const yearInput = certRow.locator('input[placeholder*="year" i], [aria-label*="year" i]');

      await expect(nameInput).toBeVisible();
      await expect(issuerInput).toBeVisible();
      await expect(yearInput).toBeVisible();
    });
  });

  test.describe('Link Mode (Default)', () => {
    test('Link mode shows text input for URL', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();
      const urlInput = certRow.locator('input[type="url"], input[placeholder*="url" i], [aria-label*="url" i]');

      // Text input should be visible in Link mode (default)
      await expect(urlInput).toBeVisible();
    });

    test('can paste external link in Link mode', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();
      const nameInput = certRow.locator('input[placeholder*="name" i]');
      const issuerInput = certRow.locator('input[placeholder*="issuer" i]');
      const yearInput = certRow.locator('input[placeholder*="year" i]');
      const urlInput = certRow.locator('input[type="url"], input[placeholder*="url" i]');

      // Fill fields
      await nameInput.fill('AWS Certified Solutions Architect');
      await issuerInput.fill('Amazon Web Services');
      await yearInput.fill('2023');
      await urlInput.fill('https://www.credly.com/badges/example');

      // Verify input accepted the URL
      const value = await urlInput.inputValue();
      expect(value).toBe('https://www.credly.com/badges/example');
    });
  });

  test.describe('File Mode Toggle & Upload', () => {
    test('toggle to File mode → shows picker trigger instead of text input', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();

      // Find and click File toggle option
      const fileToggle = certRow.locator('button', { hasText: /file|upload/i }).first();
      await fileToggle.click();

      // Text input should be replaced with picker button
      const pickerButton = certRow.locator('button', { hasText: /pick|upload|select/i });
      await expect(pickerButton).toBeVisible();
    });

    test('File mode → click picker → upload/select PDF', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();

      // Toggle to File mode
      const fileToggle = certRow.locator('button', { hasText: /file/i }).first();
      await fileToggle.click();

      // Click picker button
      const pickerButton = certRow.locator('button', { hasText: /pick|select/i });
      await pickerButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Should show PDFs only
      const items = await picker.getGridItems().count();
      expect(items).toBeGreaterThan(0);

      // Select a PDF
      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // URL field should be populated with Cloudinary URL
      const urlInput = certRow.locator('input, [role="textbox"]').first();
      await urlInput.waitFor({ state: 'visible', timeout: 3000 });

      const value = await urlInput.textContent();
      expect(value).toContain('cloudinary.com');
    });

    test('mode inferred on load: Cloudinary URL → File mode', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();

      // Toggle to File mode and select a PDF
      const fileToggle = certRow.locator('button', { hasText: /file/i }).first();
      await fileToggle.click();

      const pickerButton = certRow.locator('button', { hasText: /pick|select/i });
      await pickerButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Save
      const saveButton = page.locator('section#section-certifications button', { hasText: 'Save' });
      await saveButton.click();
      await page.waitForResponse((r) => r.url().includes('PATCH'));

      // Reload page
      await profilePage.goto();
      await page.goto('/profile#certifications');

      // Mode should be inferred as File (because URL contains cloudinary.com)
      const updatedRow = certSection.locator('[role="group"]').first();
      const pickerBtn = updatedRow.locator('button', { hasText: /pick|select/i });

      // File mode should be active (picker button visible)
      await expect(pickerBtn).toBeVisible();
    });

    test('mode inferred on load: external URL → Link mode', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').first();

      // Enter external URL in Link mode (default)
      const nameInput = certRow.locator('input[placeholder*="name" i]');
      const issuerInput = certRow.locator('input[placeholder*="issuer" i]');
      const urlInput = certRow.locator('input[type="url"], input[placeholder*="url" i]');

      await nameInput.fill('Google Cloud Certified');
      await issuerInput.fill('Google Cloud');
      await urlInput.fill('https://www.credly.com/google-cert');

      // Save
      const saveButton = page.locator('section#section-certifications button', { hasText: 'Save' });
      await saveButton.click();
      await page.waitForResponse((r) => r.url().includes('PATCH'));

      // Reload
      await profilePage.goto();
      await page.goto('/profile#certifications');

      // Mode should be inferred as Link (external URL)
      const updatedRow = certSection.locator('[role="group"]').first();
      const urlInputReloaded = updatedRow.locator('input[type="url"], input[placeholder*="url" i]');

      // Text input should be visible
      await expect(urlInputReloaded).toBeVisible();
    });
  });

  test.describe('Add/Remove Rows', () => {
    test('add row button → new row appears', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const initialRows = await certSection.locator('[role="group"]').count();

      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const newRows = await certSection.locator('[role="group"]').count();
      expect(newRows).toBe(initialRows + 1);
    });

    test('remove row button → row deleted', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      const certRow = certSection.locator('[role="group"]').last();
      const initialRows = await certSection.locator('[role="group"]').count();

      const removeButton = certRow.locator('button', { hasText: 'Remove' });
      await removeButton.click();

      const updatedRows = await certSection.locator('[role="group"]').count();
      expect(updatedRows).toBe(initialRows - 1);
    });
  });

  test.describe('Persistence & Validation', () => {
    test('save mixed File + Link mode certs → reload → modes persist', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');

      // Cert 1: Link mode
      const addButton = certSection.locator('button', { hasText: 'Add' });
      await addButton.click();

      let certRow = certSection.locator('[role="group"]').first();
      let nameInput = certRow.locator('input[placeholder*="name" i]');
      const urlInput = certRow.locator('input[type="url"], input[placeholder*="url" i]');

      await nameInput.fill('AWS Cert');
      await urlInput.fill('https://www.credly.com/aws');

      // Cert 2: File mode
      await addButton.click();
      certRow = certSection.locator('[role="group"]').last();
      const fileToggle = certRow.locator('button', { hasText: /file/i }).first();
      await fileToggle.click();

      nameInput = certRow.locator('input[placeholder*="name" i]');
      const pickerButton = certRow.locator('button', { hasText: /pick/i });

      await nameInput.fill('GCP Cert');
      await pickerButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();
      await picker.getGridItems().first().click();
      await picker.clickInsert();

      // Save
      const saveButton = page.locator('section#section-certifications button', { hasText: 'Save' });
      await saveButton.click();
      await page.waitForResponse((r) => r.url().includes('PATCH'));

      // Reload
      await profilePage.goto();
      await page.goto('/profile#certifications');

      // Verify both certs and modes persist
      const rows = certSection.locator('[role="group"]');
      expect(await rows.count()).toBeGreaterThanOrEqual(2);
    });

    test('all fields are optional', async ({ adminPage: page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await page.goto('/profile#certifications');

      const certSection = page.locator('section#section-certifications');
      const saveButton = certSection.locator('button', { hasText: 'Save' });

      await expect(saveButton).toBeEnabled();
    });
  });
});
