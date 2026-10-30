import { type Locator, type Page } from '@playwright/test';

import { CONSOLE_URL } from '../fixtures/base-url';

/**
 * Page Objects for the console side of the medicine cabinet edit flow (R16): 'S9 Đăng nhập console'
 * and 'S2 Form sản phẩm'. Both live on the console origin.
 */
export class ConsoleLoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto(`${CONSOLE_URL}/auth/login`);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.locator('input[formControlName="email"]').fill(email);
    await this.page.locator('input[formControlName="password"]').fill(password);
    await this.page.locator('button[type="submit"]').click();
  }
}

export class ConsoleItemFormPage {
  constructor(private readonly page: Page) {}

  get doseInput(): Locator {
    return this.page.locator('input[formControlName="dose"]');
  }

  /** The chip-style list of active ingredients; each one has a remove button named after it. */
  removeIngredient(name: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`remove ${name}`, 'i') });
  }

  async waitForForm(): Promise<void> {
    await this.page.waitForURL(
      (url) => url.origin === CONSOLE_URL && /\/medicine-cabinet\/[^/]+\/edit$/.test(url.pathname)
    );
    await this.doseInput.waitFor({ state: 'visible' });
  }

  async setDose(dose: string): Promise<void> {
    await this.doseInput.fill(dose);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }
}
