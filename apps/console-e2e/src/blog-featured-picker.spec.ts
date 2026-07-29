import { test, expect } from './fixtures/auth.fixture';
import { PostFormPage } from './pages/post-form.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';

/**
 * The blog editor lives at `/admin/blog/new` — `/blog` is not a console route at all and
 * falls through `app.routes.ts`'s `**` redirect to the dashboard, so a spec that navigates
 * there asserts against the wrong page and fails on everything downstream.
 *
 * Unlike the skill and project editors this page has no section tabs: it is a two-column
 * layout with every card mounted, so there is nothing to activate before reaching the
 * featured-image field in the right-hand Overview card.
 *
 * Scope note: these tests stop before saving. `content` carries `richTextRequiredValidator`
 * and the editor is a document-engine instance mounted imperatively, so driving it belongs
 * with the blog-crud spec rather than with picker coverage.
 */
test.describe('Blog Featured Image Picker', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    for (const name of ['blog-featured-a.png', 'blog-featured-b.png']) {
      const file = MediaPage.createTestFile(name);
      const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
      await mediaPage.uploadFile(file);
      await responsePromise;
    }
  });

  test('list page links to the editor', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.goto();

    // `<a mat-flat-button routerLink="./new">` — a link, never role=button. MatButton's host
    // binding adds a class and no role, so `getByRole('button')` finds nothing here.
    await expect(form.newPostLink).toBeVisible();
    await form.newPostLink.click();

    await expect(page).toHaveURL(/\/admin\/blog\/new$/);
    await expect(form.heading).toBeVisible();
  });

  test('featured image starts empty with a Choose image trigger', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();

    await expect(form.featuredChooseButton).toBeVisible();
    await expect(form.featuredPreview).toBeHidden();
    await expect(form.featuredReplaceButton).toBeHidden();
  });

  test('trigger opens the picker in single-select mode', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.openFeaturedPicker();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    await expect(picker.dialog.locator('h3')).toHaveText('Select Media');
    await expect(picker.getGridItems().first()).toBeVisible();
  });

  test('inserting an image renders the preview and swaps in Replace/Remove', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.openFeaturedPicker();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    await expect(form.featuredPreview).toBeVisible();
    await expect(form.featuredReplaceButton).toBeVisible();
    await expect(form.featuredRemoveButton).toBeVisible();
    await expect(form.featuredChooseButton).toBeHidden();
  });

  test('Replace swaps the image for a different one', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.openFeaturedPicker();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().nth(0).click();
    await picker.clickInsert();
    const firstSrc = await form.featuredPreview.getAttribute('src');

    await form.featuredReplaceButton.click();
    await picker.waitForOpen();
    await picker.getGridItems().nth(1).click();
    await picker.clickInsert();

    await expect(form.featuredPreview).not.toHaveAttribute('src', firstSrc as string);
  });

  test('Remove clears the image back to the Choose trigger', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.openFeaturedPicker();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();
    await expect(form.featuredPreview).toBeVisible();

    await form.featuredRemoveButton.click();

    await expect(form.featuredChooseButton).toBeVisible();
    await expect(form.featuredPreview).toBeHidden();
  });

  test('cancelling the picker leaves the field empty', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.openFeaturedPicker();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickCancel();

    await expect(form.featuredChooseButton).toBeVisible();
    await expect(form.featuredPreview).toBeHidden();
  });

  test('saving without a cover surfaces the PST-011 requirement', async ({ adminPage: page }) => {
    const form = new PostFormPage(page);
    await form.gotoNew();
    await form.titleInput.fill(`e2e-featured-${Date.now()}`);

    // `featuredImageId` uses an empty-string sentinel with `Validators.required`, so the
    // submit is gated on the cover even when everything else is filled in.
    await form.saveButton.click();

    await expect(form.featuredBlock.locator('.field-block__error')).toContainText('PST-011');
    await expect(page).toHaveURL(/\/admin\/blog\/new$/);
  });
});
