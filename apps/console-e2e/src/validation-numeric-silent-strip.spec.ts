import { test, expect } from './fixtures/auth.fixture';
import { ExperienceFormPage } from './pages/experience-form.page';

/**
 * Regression spec for the post-mortem 2026-04-29 — quantity `<input type="number">` fields had
 * no `<mat-error>` rendering, so out-of-range values failed silently with a server toast.
 * After the fix, every quantity input wired to a min/max validator surfaces the error inline.
 *
 * `type="number"` rejects non-numeric typing at the browser level (Chrome empties the DOM value
 * before Angular ever sees it), so this spec drives out-of-range *valid numbers* — 0 against
 * `LIMITS.TEAM_SIZE_MIN` of 1 — rather than letters.
 *
 * The reason this file used to time out has nothing to do with validation: Team Size lives in
 * the **Context** section, and every section body on the experience form is `[hidden]` until its
 * rail tab is selected. `activate()` is what makes the field reachable.
 */
test.describe('Numeric inputs surface validator errors inline', () => {
  test('teamSizeMin renders a mat-error when below the minimum', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();
    await form.activate('section-context');

    await form.fillAndBlur('teamSizeMin', '0');

    // `LIMITS.TEAM_SIZE_MIN` is 1, and `min` resolves through DEFAULT_VALIDATION_MESSAGES.
    await expect(form.errorFor('teamSizeMin')).toHaveText('Must be at least 1.');
  });

  test('teamSizeMin accepts a valid integer without error', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();
    await form.activate('section-context');

    await form.fillAndBlur('teamSizeMin', '8');

    await expect(form.errorFor('teamSizeMin')).toHaveCount(0);
  });

  test('teamSizeMax is validated independently of teamSizeMin', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();
    await form.activate('section-context');

    await form.fillAndBlur('teamSizeMin', '8');
    await form.fillAndBlur('teamSizeMax', '0');

    await expect(form.errorFor('teamSizeMax')).toBeVisible();
    await expect(form.errorFor('teamSizeMin')).toHaveCount(0);
  });

  test('an empty team size is not an error — both fields are optional', async ({ adminPage: page }) => {
    const form = new ExperienceFormPage(page);
    await form.gotoNew();
    await form.activate('section-context');

    // Touch and leave blank: `baselineFor.integer` skips empty values, so no error should show.
    await form.fillAndBlur('teamSizeMin', '');

    await expect(form.errorFor('teamSizeMin')).toHaveCount(0);
  });
});
