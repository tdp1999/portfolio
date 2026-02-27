import { type Locator, type Page } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[formControlName="email"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.backToLoginLink = page.locator('a[href="/auth/login"]');
    this.successHeading = page.locator('h2', { hasText: 'Check your email' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/forgot-password');
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
