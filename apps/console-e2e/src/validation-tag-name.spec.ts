import { test, expect } from './fixtures/auth.fixture';
import { TagFormPage } from './pages/tag-form.page';
import { prisma } from './helpers/db';

/**
 * Regression spec for the validation centralization epic — Tag.name is capped at 50 chars on
 * both FE (`Validators.maxLength(LIMITS.TAG_NAME_MAX)`) and BE (`TagNameSchema`). Before
 * centralization the FE allowed 100 and the server rejected anything over 50, so users got a
 * server toast instead of an inline `<mat-error>`. What is asserted here is that the FE blocks
 * first.
 *
 * Two shape notes, both of which used to make this spec time out rather than fail:
 *
 * - Creating a tag is a *route* (`/tags/new`), not a dialog.
 * - The submit control is the sticky save bar's **"Save changes"**, not a button called "Save".
 *   The form's own `<button type="submit">` is `class="hidden" aria-hidden="true"`, so it is
 *   unreachable by role on purpose.
 */
test.describe('Tag.name max-length validation (FE inline)', () => {
  const OVER_LIMIT = 'a'.repeat(51);
  const AT_LIMIT = 'a'.repeat(50);

  /** Written by the boundary test below; nothing else in this file reaches the server. */
  const createdNames: string[] = [];

  test.afterAll(async () => {
    if (createdNames.length > 0) {
      await prisma.tag.deleteMany({ where: { name: { in: createdNames } } });
    }
  });

  test('typing 51 characters surfaces an inline mat-error', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    await form.fillName(OVER_LIMIT);

    await expect(form.nameError).toContainText('50 characters or less');
  });

  test('typing exactly 50 characters has no inline error', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    await form.fillName(AT_LIMIT);

    await expect(form.nameError).toHaveCount(0);
  });

  test('an over-limit name never reaches the server', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    const posts: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().includes('/api/tags')) posts.push(req.url());
    });

    await form.fillName(OVER_LIMIT);
    // Enabled regardless of validity — `submit()` is what guards, by bailing on `form.invalid`.
    await form.saveButton.click();

    // Staying put is the observable consequence: a successful create navigates to /tags/:id.
    await expect(page).toHaveURL(/\/tags\/new$/);
    await expect(form.nameError).toContainText('50 characters or less');
    expect(posts).toEqual([]);
  });

  test('a name at the limit does reach the server', async ({ adminPage: page }) => {
    const form = new TagFormPage(page);
    await form.gotoNew();

    // Unique, so a leftover tag from an earlier run cannot turn this into a duplicate-name 409.
    // Padded back out to exactly 50 — the point of the test is the boundary, not the prefix.
    const name = `e2e-len-${Date.now()}`.padEnd(50, 'x').slice(0, 50);
    createdNames.push(name);
    await form.fillName(name);

    const response = page.waitForResponse((r) => r.url().includes('/api/tags') && r.request().method() === 'POST');
    await form.saveButton.click();

    expect((await response).status()).toBe(201);
  });
});
