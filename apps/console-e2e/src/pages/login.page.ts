import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleButton: Locator;
  readonly togglePasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[formControlName="email"]');
    this.passwordInput = page.locator('input[formControlName="password"]');
    this.rememberMeCheckbox = page.locator('mat-checkbox');
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]');
    this.googleButton = page.locator('button', { hasText: 'Continue with Google' });
    this.togglePasswordButton = page.locator('button[mat-icon-button]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
