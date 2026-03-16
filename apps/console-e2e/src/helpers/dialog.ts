import { type Page } from '@playwright/test';

export function confirmDialog(page: Page) {
  const container = page.locator('mat-dialog-container');
  return {
    container,
    confirmButton: container.locator('button[color="warn"]'),
    cancelButton: container.locator('button', { hasText: 'Cancel' }),
  };
}

export async function clickConfirm(page: Page): Promise<void> {
  await confirmDialog(page).confirmButton.click();
}

export async function clickCancel(page: Page): Promise<void> {
  await confirmDialog(page).cancelButton.click();
}
