import { test, expect, type Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────

/**
 * Stubs `window.turnstile` so the contact page doesn't try to render the real
 * Cloudflare widget (slow + flaky in CI). The stub fires the success callback
 * immediately with a fixed token. We also block the api.js fetch as a belt-
 * and-suspenders measure so the real script can't race against the stub.
 */
async function stubTurnstile(page: Page): Promise<void> {
  await page.route('https://challenges.cloudflare.com/**', (route) => route.abort());
  await page.addInitScript(() => {
    (window as unknown as { turnstile: unknown }).turnstile = {
      render: (_container: Element | string, opts: { callback: (token: string) => void }): string => {
        queueMicrotask(() => opts.callback('e2e-stub-token'));
        return 'e2e-stub-widget-id';
      },
      reset: (): void => undefined,
      remove: (): void => undefined,
    };
  });
}

/**
 * Intercepts the contact submit endpoint and returns a fake-success response.
 * The BE Turnstile verifier would otherwise reject our stub token (the secret
 * is configured in dev). The BE submission path is already covered by handler
 * unit specs; this E2E focuses on the FE wiring — chip preselect, form fill,
 * success state.
 */
async function mockContactSubmit(page: Page, status = 201, body: unknown = { id: 'e2e-mock-id' }): Promise<void> {
  await page.route('**/api/contact-messages', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function gotoContact(page: Page, queryString = ''): Promise<void> {
  await page.goto(`/contact${queryString}`);
  // Wait until Angular has hydrated the form so click handlers are wired up
  // AND any `?purpose=…` effect has run. Filling inputs before hydration races
  // against Angular wiping `value` during hydration — confirming the chip
  // selection has settled is a cheap proxy for "form is interactive".
  await page.locator('form.contact-form').waitFor({ state: 'visible' });
  await page.locator('#contact-name').waitFor({ state: 'visible' });
  await page.waitForLoadState('networkidle');
}

/**
 * Fills then re-asserts the input value because Angular's hydration can
 * occasionally clobber a `.fill()` that lands before the control finishes
 * wiring up. A short retry per field keeps the test stable without giving up
 * on real bugs.
 */
async function fillAndConfirm(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);
  for (let attempt = 0; attempt < 3; attempt++) {
    await input.fill(value);
    if ((await input.inputValue()) === value) return;
  }
  throw new Error(`Failed to fill ${selector} with stable value after 3 attempts`);
}

async function fillValidContactForm(
  page: Page,
  overrides: Partial<{ name: string; email: string; message: string }> = {}
): Promise<void> {
  await fillAndConfirm(page, '#contact-name', overrides.name ?? 'E2E Contact Tester');
  await fillAndConfirm(page, '#contact-email', overrides.email ?? `e2e-contact-${Date.now()}@test-safe.com`);
  await fillAndConfirm(
    page,
    '#contact-message',
    overrides.message ?? 'This is an end-to-end test submission that easily clears the ten-character minimum.'
  );
  await page.locator('#contact-consent').check();
}

// ── Tests ─────────────────────────────────────────────────

test.describe('Landing /contact submission', () => {
  test.beforeEach(async ({ page }) => {
    await stubTurnstile(page);
  });

  test('preselects the purpose chip from ?purpose=hire query param', async ({ page }) => {
    await gotoContact(page, '?purpose=hire');
    await expect(page.locator('#contact-purpose-tab-hire')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#contact-purpose-tab-hi')).toHaveAttribute('aria-selected', 'false');
  });

  test('defaults to "Just say hi" when no purpose query param is provided', async ({ page }) => {
    await gotoContact(page);
    await expect(page.locator('#contact-purpose-tab-hi')).toHaveAttribute('aria-selected', 'true');
  });

  test('submits a valid message and lands on the success state', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page, '?purpose=collab');
    await fillValidContactForm(page);

    await page.locator('button[type="submit"].contact-form__submit').click();

    const successHeading = page.locator('.contact-success__heading');
    await expect(successHeading).toBeVisible({ timeout: 10000 });
    await expect(successHeading).toContainText(/Sent|Đã gửi/);
  });

  test('forwards the selected purpose chip in the submit payload', async ({ page }) => {
    let capturedBody: { purpose?: string } | null = null;
    await page.route('**/api/contact-messages', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      capturedBody = route.request().postDataJSON() as { purpose?: string };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'e2e-mock-id' }),
      });
    });

    await gotoContact(page, '?purpose=press');
    await page.locator('#contact-name').scrollIntoViewIfNeeded();
    await fillValidContactForm(page);
    await page.locator('button[type="submit"].contact-form__submit').click();
    await expect(page.locator('.contact-success__heading')).toBeVisible({ timeout: 10000 });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.purpose).toBe('PRESS');
  });

  test('renders an inline error and stays on the form when name is missing', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    // Submit empty form — markAllAsTouched fires, inline error appears, no network call goes out.
    await page.locator('button[type="submit"].contact-form__submit').click();

    await expect(page.locator('.contact-success__heading')).toHaveCount(0);
    await expect(page.locator('#contact-name-error')).toBeVisible();
  });

  // ── F2 ── all per-field errors show on submit
  test('shows the error for every invalid field on an empty submit', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);
    await page.locator('button[type="submit"].contact-form__submit').click();

    await expect(page.locator('#contact-name-error')).toBeVisible();
    await expect(page.locator('#contact-email-error')).toBeVisible();
    await expect(page.locator('#contact-message-error')).toBeVisible();
    // Consent error has no metaId so it renders inside its form-field meta row.
    // Confirm it via its visible text rather than an id.
    await expect(page.getByText('You must agree before sending.')).toBeVisible();
  });

  // ── F3 ── error surfaces on blur, not only on submit
  test('shows the name error on first blur with an empty value', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    // Focus the name input, then blur to another field (email).
    await page.locator('#contact-name').focus();
    await page.locator('#contact-email').focus();

    await expect(page.locator('#contact-name-error')).toBeVisible();
    // Email error should NOT be visible yet — email was focused, not yet blurred.
    await expect(page.locator('#contact-email-error')).toHaveCount(0);
  });

  // ── F4 ── error clears after fixing the value
  test('clears the name error after typing a valid name and blurring', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    // Trigger the error first.
    await page.locator('#contact-name').focus();
    await page.locator('#contact-email').focus();
    await expect(page.locator('#contact-name-error')).toBeVisible();

    // Fix the value.
    await fillAndConfirm(page, '#contact-name', 'Phương Trần');
    await page.locator('#contact-name').blur();

    await expect(page.locator('#contact-name-error')).toHaveCount(0);
  });

  // ── F5 ── invalid email shape surfaces validator
  test('shows the email validator error for an invalid address', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    await fillAndConfirm(page, '#contact-email', 'not-an-email');
    await page.locator('#contact-email').blur();

    await expect(page.locator('#contact-email-error')).toBeVisible();
  });

  // ── F7 ── message minLength
  test('shows the message error when fewer than 10 characters are typed', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    await fillAndConfirm(page, '#contact-message', 'short');
    await page.locator('#contact-message').blur();

    await expect(page.locator('#contact-message-error')).toBeVisible();
  });

  // ── F9 ── hint placement on message field
  test('renders the message hint on the right when no error is set', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    // Hint is "10–5000 characters" — visible without any error.
    const hint = page.getByText('10–5000 characters');
    await expect(hint).toBeVisible();

    // Hint sits inside the right-aligned `.ff__hint` slot.
    const hintEl = await hint.elementHandle();
    const className = await hintEl?.evaluate((el) => el.className);
    expect(className).toContain('ff__hint');
  });

  // ── F9b ── error takes priority over hint
  test('hides the message hint once an error is present on the message field', async ({ page }) => {
    await mockContactSubmit(page);
    await gotoContact(page);

    // Trigger the message error.
    await fillAndConfirm(page, '#contact-message', 'short');
    await page.locator('#contact-message').blur();

    // Error is visible.
    await expect(page.locator('#contact-message-error')).toBeVisible();
    // Hint paragraph is hidden — error wins per the form-field contract.
    await expect(page.locator('.ff__hint').filter({ hasText: '10–5000 characters' })).toHaveCount(0);
  });

  // ── F8 ── full happy path with the new primitives
  test('completes a valid submission through the new form primitives', async ({ page }) => {
    let captured: { name?: string; email?: string; message?: string } | null = null;
    await page.route('**/api/contact-messages', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      captured = route.request().postDataJSON() as typeof captured;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'e2e-mock-id' }),
      });
    });

    await gotoContact(page, '?purpose=collab');
    await fillValidContactForm(page);
    await page.locator('button[type="submit"].contact-form__submit').click();
    await expect(page.locator('.contact-success__heading')).toBeVisible({ timeout: 10000 });

    expect(captured).not.toBeNull();
    expect(captured!.name).toBeTruthy();
    expect(captured!.email).toContain('@');
  });
});
