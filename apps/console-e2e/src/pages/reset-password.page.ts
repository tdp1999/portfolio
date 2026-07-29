import { type Locator, type Page } from '@playwright/test';

export class ResetPasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly errorHeading: Locator;
  readonly backToLoginLink: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.togglePasswordButton = page.locator('button[mat-icon-button]');
    this.errorHeading = page.locator('h2', { hasText: 'Invalid reset link' });
    this.backToLoginLink = page.locator('a[href="/auth/login"]');
    // Scoped to each field's own `mat-form-field`: `<mat-error>` is only in the DOM while that
    // field is in an error state, so an unscoped `mat-error` would match whichever one is live.
    this.passwordError = this.errorFor(this.passwordInput);
    this.confirmPasswordError = this.errorFor(this.confirmPasswordInput);
  }

  private errorFor(input: Locator): Locator {
    return this.page.locator('mat-form-field').filter({ has: input }).locator('mat-error');
  }

  async goto(token: string, userId: string): Promise<void> {
    await this.page.goto(`/auth/reset-password?token=${token}&userId=${userId}`);
  }

  async resetPassword(password: string, confirmPassword: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }
}
