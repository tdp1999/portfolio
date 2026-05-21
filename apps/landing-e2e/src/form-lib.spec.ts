import { test, expect, type Page } from '@playwright/test';

/**
 * Smoke E2E for the form lib (C21) using `/ddl/form-lib` as the live playground.
 * Covers the primitive behaviors A-E listed in the form-lib test plan that are
 * cheap to verify end-to-end. Per-primitive unit specs (Jest) carry the
 * exhaustive contract; this file confirms the live wiring stays consistent.
 */

async function gotoFormLib(page: Page): Promise<void> {
  await page.goto('/ddl/form-lib');
  await page.locator('form.fl-form').waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
}

async function fillAndConfirm(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);
  for (let i = 0; i < 3; i++) {
    await input.fill(value);
    if ((await input.inputValue()) === value) return;
  }
  throw new Error(`Could not stably fill ${selector}`);
}

test.describe('Form lib · /ddl/form-lib smoke', () => {
  // ── A — landing-input
  test('input writes through to the FormControl JSON view', async ({ page }) => {
    await gotoFormLib(page);
    await fillAndConfirm(page, '#fl-name', 'Phương Trần');
    await expect(page.locator('.fl-debug__json')).toContainText('"name": "Phương Trần"');
  });

  // ── B — landing-textarea
  test('textarea preserves newlines through to the FormControl value', async ({ page }) => {
    await gotoFormLib(page);
    const ta = page.locator('#fl-message');
    await ta.fill('line one\nline two\nline three with at least ten chars');
    await expect(page.locator('.fl-debug__json')).toContainText('line one');
    await expect(page.locator('.fl-debug__json')).toContainText('line three with at least ten chars');
  });

  // ── C — landing-checkbox
  test('checkbox toggles the consent FormControl boolean', async ({ page }) => {
    await gotoFormLib(page);

    // Initially false.
    await expect(page.locator('.fl-debug__json')).toContainText('"consent": false');

    // Toggling via the native input (Playwright .check sees the input on top
    // of the visual box, post-fix).
    await page.locator('#fl-consent').check();
    await expect(page.locator('.fl-debug__json')).toContainText('"consent": true');
  });

  // ── D — landing-radio
  test('radio group keeps only one option selected and writes to the FormControl', async ({ page }) => {
    await gotoFormLib(page);

    // Default seeded value is 'recruiter'.
    await expect(page.locator('.fl-debug__json')).toContainText('"audience": "recruiter"');

    // Pick a different option.
    await page.locator('input[type="radio"][value="press"]').check();
    await expect(page.locator('.fl-debug__json')).toContainText('"audience": "press"');

    // The other two unchecked.
    await expect(page.locator('input[type="radio"][value="recruiter"]')).not.toBeChecked();
    await expect(page.locator('input[type="radio"][value="client"]')).not.toBeChecked();
  });

  // ── E5 — error left-aligned with role=alert
  test('error renders inside .ff__error with role=alert when the field is invalid + touched', async ({ page }) => {
    await gotoFormLib(page);

    await page.getByRole('button', { name: 'Validate all' }).click();

    const nameError = page.locator('.ff__error').filter({ hasText: 'Please enter your name' });
    await expect(nameError).toBeVisible();
    await expect(nameError).toHaveAttribute('role', 'alert');
  });

  // ── E7 — error wins over hint
  test('hint disappears when an error is set on the same field', async ({ page }) => {
    await gotoFormLib(page);

    // Email has both a hint ("We won't share it.") and validators.
    const emailHint = page.locator('.ff__hint').filter({ hasText: "We won't share it." });
    await expect(emailHint).toBeVisible();

    // Now make email invalid + touched.
    await page.locator('#fl-email').focus();
    await page.locator('#fl-name').focus();

    await expect(page.locator('.ff__error').filter({ hasText: 'Email is required' })).toBeVisible();
    await expect(emailHint).toHaveCount(0);
  });

  // ── E8 — error clears once fixed → hint comes back
  test('after fixing the field, the hint slot returns', async ({ page }) => {
    await gotoFormLib(page);

    // Trigger error.
    await page.locator('#fl-email').focus();
    await page.locator('#fl-name').focus();
    await expect(page.locator('.ff__error').filter({ hasText: 'Email is required' })).toBeVisible();

    // Fix.
    await fillAndConfirm(page, '#fl-email', 'phuong@example.com');
    await page.locator('#fl-email').blur();

    await expect(page.locator('.ff__error').filter({ hasText: 'Email is required' })).toHaveCount(0);
    await expect(page.locator('.ff__hint').filter({ hasText: "We won't share it." })).toBeVisible();
  });

  // ── debug — form status flips green when every field is valid
  test('FormGroup status flips to VALID once every field is satisfied', async ({ page }) => {
    await gotoFormLib(page);

    await fillAndConfirm(page, '#fl-name', 'Phương');
    await fillAndConfirm(page, '#fl-email', 'phuong@example.com');
    await fillAndConfirm(page, '#fl-message', 'A message that comfortably exceeds the ten character minimum.');
    await page.locator('#fl-consent').check();

    await expect(page.locator('.fl-debug__status code')).toHaveText('VALID');
  });

  // ── repro for the multi-field touched bug
  test('shows the error on a second field after blurring it (multi-field touched)', async ({ page }) => {
    await gotoFormLib(page);

    // Field 1: name → blur → expect error.
    await page.locator('#fl-name').focus();
    await page.locator('#fl-email').focus();
    await expect(page.locator('.ff__error').filter({ hasText: 'Please enter your name' })).toBeVisible();

    // Field 2: email → blur (focus message). The previous bug: email error
    // never appeared because `form.events` wasn't propagating child touched
    // changes through OnPush.
    await page.locator('#fl-message').focus();
    await expect(page.locator('.ff__error').filter({ hasText: 'Email is required' })).toBeVisible();

    // Field 3: message → blur (focus consent area). All three errors stack.
    await page.locator('#fl-consent').focus();
    await expect(page.locator('.ff__error').filter({ hasText: 'Message is required' })).toBeVisible();
  });

  // ── form-field — required marker
  test('required marker renders next to the label when required=true', async ({ page }) => {
    await gotoFormLib(page);
    // Name is required.
    const nameLabel = page.locator('label[for="fl-name"]');
    await expect(nameLabel.locator('.ff__required')).toBeVisible();
  });
});
