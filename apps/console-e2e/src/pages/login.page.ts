import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[formControlName="email"]');
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.rememberMeCheckbox = page.locator('mat-checkbox');
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]');
    this.googleButton = page.locator('button', { hasText: 'Continue with Google' });
    this.togglePasswordButton = page.locator('button[mat-icon-button]');
    this.emailError = this.fieldError('email');
    this.passwordError = this.fieldError('password');
  }

  /**
   * The `mat-error` belonging to one control.
   *
   * Scoping matters here: `DEFAULT_VALIDATION_MESSAGES.required` is field-agnostic
   * ("This field is required."), so an unscoped text lookup matches every empty
   * control on the form at once and trips Playwright's strict mode.
   */
  private fieldError(controlName: string): Locator {
    return this.page
      .locator('mat-form-field')
      .filter({ has: this.page.locator(`input[formControlName="${controlName}"]`) })
      .locator('mat-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  /**
   * Fills both credentials and re-fills them if they do not stick.
   *
   * A login reached by *redirect* (`/settings/change-password` → `authGuard` → `/auth/login`) can
   * be filled while the auth-bootstrap request is still in flight. The inputs already exist, so
   * `fill` reports success, and the form then resets both controls to their pristine empty state.
   * The symptom is a submit that fires no request at all, on a form showing "This field is
   * required." under two fields the test just typed into — roughly one full-suite run in ten.
   *
   * `toPass` retries the whole fill rather than waiting on a specific spinner, so it does not
   * depend on which progress indicator happens to be up.
   */
  private async fillCredentials(email: string, password: string): Promise<void> {
    await expect(async () => {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await expect(this.emailInput).toHaveValue(email, { timeout: 1_000 });
      await expect(this.passwordInput).toHaveValue(password, { timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submitButton.click();
  }
}
