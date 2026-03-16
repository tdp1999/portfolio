import { expect, type Page } from '@playwright/test';

export async function expectToast(page: Page, text: string): Promise<void> {
  await expect(page.locator('.toast-item', { hasText: text })).toBeVisible({ timeout: 5000 });
}
