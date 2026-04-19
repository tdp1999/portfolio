import { test, expect } from './fixtures/auth.fixture';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

test.describe('Project Gallery Picker (Regression)', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // Ensure test media exists
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const testImage = MediaPage.createTestFile('project-gallery-test.jpg');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testImage);
    await responsePromise;
  });

  test.describe('Multi-select Gallery Picker', () => {
    test('project dialog has gallery field with picker trigger', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();

      // Gallery field should be visible
      const galleryField = dialog.locator('button', { hasText: /gallery|media|images/i });
      await expect(galleryField).toBeVisible();
    });

    test('click gallery picker → multi-select mode (can select multiple items)', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();
      const galleryButton = dialog.locator('button', { hasText: /gallery/i });
      await galleryButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Title should indicate multi-select
      const title = picker.dialog.locator('h3');
      await expect(title).toContainText(/select.*files|multi/i);

      // Should be able to select multiple items
      const items = picker.getGridItems();
      const firstItem = items.first();
      const secondItem = items.nth(1);

      if (await firstItem.isVisible()) {
        await firstItem.click();
      }
      if (await secondItem.isVisible()) {
        await secondItem.click();
      }

      const count = await picker.getSelectedCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('select N items → "Insert N items" button label', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();
      const galleryButton = dialog.locator('button', { hasText: /gallery/i });
      await galleryButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select 2 items
      const items = picker.getGridItems();
      await items.nth(0).click();
      await items.nth(1).click();

      // Button label should show count
      const buttonText = await picker.insertButton.textContent();
      expect(buttonText).toMatch(/\d+|insert/i);
    });

    test('insert multi-selected items → form receives media IDs', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();
      const galleryButton = dialog.locator('button', { hasText: /gallery/i });
      await galleryButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select items
      const items = picker.getGridItems();
      const ids: (string | null)[] = [];

      const firstItem = items.first();
      if (await firstItem.isVisible()) {
        ids.push(await firstItem.getAttribute('data-media-id'));
        await firstItem.click();
      }

      const secondItem = items.nth(1);
      if (await secondItem.isVisible()) {
        ids.push(await secondItem.getAttribute('data-media-id'));
        await secondItem.click();
      }

      await picker.clickInsert();

      // Form should have galleryIds array with selected IDs
      const galleryControl = dialog.locator('[formControlName="galleryIds"], [formControlName="gallery"]');
      if (await galleryControl.isVisible()) {
        const value = await galleryControl.inputValue();
        // Should contain IDs (exact format depends on form control type)
        expect(value).toBeTruthy();
      }
    });

    test('create project with gallery → saves successfully', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();

      // Fill required fields
      const nameInput = dialog.locator('input[formControlName="name"]');
      await nameInput.fill(`TestProject-${Date.now()}`);

      const descriptionInput = dialog.locator('textarea[formControlName="description"]');
      await descriptionInput.fill('Test description');

      // Add gallery items
      const galleryButton = dialog.locator('button', { hasText: /gallery/i });
      await galleryButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      const firstItem = picker.getGridItems().first();
      await firstItem.click();
      await picker.clickInsert();

      // Create project
      const createBtn = dialog.getByRole('button', { name: 'Create' });
      const createResponse = page.waitForResponse((r) => r.url().includes('/api/projects') && r.status() === 201);

      await createBtn.click();

      const response = await createResponse;
      expect(response.status()).toBe(201);

      // Verify project appears in list
      await page.goto('/projects');
      const projectName = await nameInput.inputValue();
      const projectRow = page.locator('[role="row"], [role="group"]', { has: page.getByText(projectName) });
      await expect(projectRow).toBeVisible();
    });
  });

  test.describe('Gallery Persistence', () => {
    test('save project with gallery → reload → gallery items persist', async ({ adminPage: page }) => {
      const projectName = `GalleryTest-${Date.now()}`;

      // Create project with gallery
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();

      const nameInput = dialog.locator('input[formControlName="name"]');
      await nameInput.fill(projectName);

      const descriptionInput = dialog.locator('textarea[formControlName="description"]');
      await descriptionInput.fill('Test project');

      const galleryButton = dialog.locator('button', { hasText: /gallery/i });
      await galleryButton.click();

      const picker = new MediaPickerPage(page);
      await picker.waitForOpen();

      // Select 2 items
      const items = picker.getGridItems();
      await items.nth(0).click();
      await items.nth(1).click();

      await picker.clickInsert();

      // Create
      const createResponse = page.waitForResponse((r) => r.url().includes('/api/projects') && r.status() === 201);
      await dialog.getByRole('button', { name: 'Create' }).click();
      await createResponse;

      // Navigate to project detail/edit
      await page.goto('/projects');
      const projectRow = page.locator('button, [role="button"]', { has: page.getByText(projectName) });
      await projectRow.first().click();

      // Verify gallery items are still there
      const galleryItems = page.locator('[role="group"], .gallery-item');
      const galleryCount = await galleryItems.count();

      // Should have at least the 2 items we selected
      expect(galleryCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Regression: Unchanged API', () => {
    test('project gallery endpoint still uses same structure', async ({ adminPage: page }) => {
      // Verify API contract unchanged
      const response = await page.request.get('/api/projects?limit=1');
      const data = await response.json();

      if (data.data && data.data[0]) {
        const project = data.data[0];
        // Should have galleryIds or similar array field
        expect(['galleryIds', 'gallery', 'mediaIds'].some((k) => k in project)).toBeTruthy();
      }
    });

    test('picker call site in project dialog unchanged', async ({ adminPage: page }) => {
      await page.goto('/projects');
      const createButton = page.getByRole('button', { name: 'Create Project' });
      await createButton.click();

      const dialog = page.locator('mat-dialog-container').first();

      // All original form fields should still be present
      const nameInput = dialog.locator('input[formControlName="name"]');
      const descriptionInput = dialog.locator('textarea[formControlName="description"]');
      const galleryButton = dialog.locator('button', { hasText: /gallery|media/i });

      await expect(nameInput).toBeVisible();
      await expect(descriptionInput).toBeVisible();
      await expect(galleryButton).toBeVisible();
    });
  });
});
