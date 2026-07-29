import { test, expect } from './fixtures/auth.fixture';
import { SkillsPage } from './pages/skills.page';
import { SkillFormPage } from './pages/skill-form.page';
import { MediaPage } from './pages/media.page';
import { MediaPickerPage } from './pages/media-picker.page';
import { TEST_SKILL_PREFIX } from './data/test-skills';
import { deleteTestSkills } from './helpers/db-skills';

/**
 * The skill icon is chosen through the shared media picker on the routed skill form
 * (`/skills/new`, `/skills/:id/edit`) — not in a dialog, and with no `iconId` form control
 * to read back. `iconId` lives in a signal and only surfaces as the preview `<img>` plus the
 * "Pick Icon" / "Change Icon" trigger label, so every assertion below goes through those.
 */
test.describe('Skill Icon Picker', () => {
  test.beforeEach(async ({ adminPage: page }) => {
    // One image in the library is enough for the grid to have something selectable.
    const mediaPage = new MediaPage(page);
    await mediaPage.goto();

    const testIcon = MediaPage.createTestFile('icon-test.png');
    const responsePromise = page.waitForResponse((r) => r.url().includes('/api/media/upload'));
    await mediaPage.uploadFile(testIcon);
    await responsePromise;
  });

  test.afterAll(async () => {
    await deleteTestSkills();
  });

  test('icon section starts empty, with a Pick Icon trigger', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-icon');

    await expect(form.iconPlaceholder).toBeVisible();
    await expect(form.iconTrigger).toHaveText(/Pick Icon/);
    await expect(form.iconPreview).toBeHidden();
    await expect(form.iconRemoveButton).toBeHidden();
  });

  test('trigger opens the media picker with a populated grid', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-icon');
    await form.iconTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();

    await expect(picker.getGridItems().first()).toBeVisible();
  });

  test('inserting a selection renders the preview and flips the trigger label', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-icon');
    await form.iconTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    await expect(form.iconPreview).toBeVisible();
    await expect(form.iconTrigger).toHaveText(/Change Icon/);
    await expect(form.iconRemoveButton).toBeVisible();
  });

  test('cancelling the picker leaves the icon untouched', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-icon');
    await form.iconTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickCancel();

    await expect(form.iconPlaceholder).toBeVisible();
    await expect(form.iconPreview).toBeHidden();
  });

  test('remove clears the icon back to the placeholder', async ({ adminPage: page }) => {
    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.activate('section-icon');
    await form.iconTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();
    await expect(form.iconPreview).toBeVisible();

    await form.iconRemoveButton.click();

    await expect(form.iconPlaceholder).toBeVisible();
    await expect(form.iconTrigger).toHaveText(/Pick Icon/);
  });

  test('icon survives create and reload', async ({ adminPage: page }) => {
    const skillName = `${TEST_SKILL_PREFIX}icon-persist`;

    const form = new SkillFormPage(page);
    await form.gotoNew();
    await form.fillRequired(skillName);

    await form.activate('section-icon');
    await form.iconTrigger.click();

    const picker = new MediaPickerPage(page);
    await picker.waitForOpen();
    await picker.getGridItems().first().click();
    await picker.clickInsert();

    const chosenSrc = await form.iconPreview.getAttribute('src');
    expect(chosenSrc).toBeTruthy();

    expect(await form.save('POST')).toBe(201);

    // Reopen through the list so the edit route is exercised the way a user reaches it.
    const skillsPage = new SkillsPage(page);
    await skillsPage.goto();
    const reopened = await skillsPage.openEditForm(skillName);
    await reopened.activate('section-icon');

    await expect(reopened.iconPreview).toHaveAttribute('src', chosenSrc as string);
    await expect(reopened.iconTrigger).toHaveText(/Change Icon/);
  });

  test('API exposes iconId on the skill record', async ({ adminPage: page }) => {
    const response = await page.request.get('/api/skills?limit=1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Assert the field is part of the contract rather than skipping when the list is empty —
    // a vacuous pass here is exactly how the old spec hid the dialog-era drift for months.
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('iconId');
  });
});
