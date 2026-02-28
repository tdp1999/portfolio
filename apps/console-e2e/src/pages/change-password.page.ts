import { type Locator, type Page } from '@playwright/test';

export class ChangePasswordPage {
  readonly page: Page;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly toggleCurrentPasswordButton: Locator;
  readonly toggleNewPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.currentPasswordInput = page.locator('input[formControlName="currentPassword"]');
    this.newPasswordInput = page.locator('input[formControlName="newPassword"]');
    this.confirmPasswordInput = page.locator('input[formControlName="confirmPassword"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.toggleCurrentPasswordButton = page
      .locator('input[formControlName="currentPassword"]')
      .locator('..')
      .locator('..')
      .locator('button[mat-icon-button]');
    this.toggleNewPasswordButton = page
      .locator('input[formControlName="newPassword"]')
      .locator('..')
      .locator('..')
      .locator('button[mat-icon-button]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/change-password');
    await this.page.waitForSelector('input[formControlName="currentPassword"]');
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword?: string): Promise<void> {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword ?? newPassword);
    await this.submitButton.click();
  }
}
