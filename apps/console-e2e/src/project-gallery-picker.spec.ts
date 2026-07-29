import { test, expect } from './fixtures/auth.fixture';
import { ProjectFormPage } from './pages/project-form.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

/**
 * Thumbnail and gallery both open the shared media picker from the Media section of the
 * routed project form (`/projects/new`), which starts `[hidden]` because the page ships
 * `showAll = signal(false)` — hence the `activate('section-media')` in every test.
 *
 * Scope note: these tests stop at the picker → form hand-off and never save. A project needs
 * title, one-liner, start date, motivation, description and role filled in both languages
 * before the API will accept it, so "gallery survives a round trip" belongs with the
 * project-crud spec that owns a `fillRequired` helper, not here.
 */
test.describe('Project Gallery Picker', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // Two images, so the multi-select assertions have something to select twice.
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    for (const name of ['project-gallery-a.png', 'project-gallery-b.png']) {
      const file = MediaPage.createTestFile(name);
      const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
      await mediaPage.uploadFile(file);
      await responsePromise;
    }
  });

  // ─── Thumbnail (single-select) ───────────────────────────────────

  test('thumbnail trigger opens the picker in single-select mode', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.thumbnailTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    await expect(picker.dialog.locator('h3')).toHaveText('Select Media');
  });

  test('inserting a thumbnail renders the preview and a clear button', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.thumbnailTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    await expect(form.thumbnailPreview).toBeVisible();
    await expect(form.thumbnailTrigger).toHaveText(/Change Thumbnail/);
    await expect(form.thumbnailClearButton).toBeVisible();

    await form.thumbnailClearButton.click();
    await expect(form.thumbnailPreview).toBeHidden();
    await expect(form.thumbnailTrigger).toHaveText(/Choose Thumbnail/);
  });

  // ─── Gallery (multi-select) ──────────────────────────────────────

  test('gallery trigger opens the picker in multi-select mode', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    await expect(picker.dialog.locator('h3')).toHaveText('Select Media Files');
  });

  test('selecting two items updates the count and the Insert label', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    const items = picker.getGridItems();
    await items.nth(0).click();
    await expect(picker.selectedCount).toHaveText(/1 selected/);
    // Strings, not regexes. `toHaveText` normalizes whitespace only for a string match, and the
    // rendered label is " Insert 1 item " — so the anchored `/Insert 1 item$/` could never match
    // while still reporting a value that looks identical in the diff.
    await expect(picker.insertButton).toHaveText('Insert 1 item');

    await items.nth(1).click();
    await expect(picker.selectedCount).toHaveText(/2 selected/);
    await expect(picker.insertButton).toHaveText('Insert 2 items');
  });

  test('inserted items become gallery rows in order', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    const items = picker.getGridItems();
    await items.nth(0).click();
    await items.nth(1).click();
    await picker.clickInsert();

    await expect(form.galleryRows).toHaveCount(2);
    expect(await form.galleryCount()).toBe(2);
  });

  test('removing a gallery row drops it from the list and the count', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().nth(0).click();
    await picker.getGridItems().nth(1).click();
    await picker.clickInsert();
    await expect(form.galleryRows).toHaveCount(2);

    await form.galleryRowRemoveButton(0).click();

    await expect(form.galleryRows).toHaveCount(1);
    expect(await form.galleryCount()).toBe(1);
  });

  test('reopening the gallery picker pre-selects the current images', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().nth(0).click();
    await picker.clickInsert();
    await expect(form.galleryRows).toHaveCount(1);

    // `pickGalleryImages()` passes the current mediaIds as `selectedIds`, so the picker must
    // reopen with that item already counted rather than starting from an empty selection.
    await form.galleryTrigger.click();
    await picker.waitForOpen();
    await expect(picker.selectedCount).toHaveText(/1 selected/);
  });

  test('cancelling the gallery picker leaves the existing rows untouched', async ({ adminPage: page }) => {
    const form = new ProjectFormPage(page);
    await form.gotoNew();
    await form.activate('section-media');
    await form.galleryTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().nth(0).click();
    await picker.clickInsert();
    await expect(form.galleryRows).toHaveCount(1);

    await form.galleryTrigger.click();
    await picker.waitForOpen();
    await picker.getGridItems().nth(1).click();
    await picker.clickCancel();

    await expect(form.galleryRows).toHaveCount(1);
  });
});
