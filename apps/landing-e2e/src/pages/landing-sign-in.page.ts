import { type Locator, type Page } from '@playwright/test';

/** Page Object for 'S7 Sign in của landing' (`/sign-in`). */
export class LandingSignInPage {
  constructor(private readonly page: Page) {}

  // `formControlName` sits on `<landing-input>`; the inner inputs carry these ids.
  get emailInput(): Locator {
    return this.page.locator('#sign-in-email');
  }

  get passwordInput(): Locator {
    return this.page.locator('#sign-in-password');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.page.locator('form button[type="submit"]').click();
  }
}
