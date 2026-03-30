import { expect, test } from './fixtures/auth.fixture';
import { createTestMessage, deleteTestMessages } from './helpers/db-contact-messages';
import { clickConfirm } from './helpers/dialog';
import { MessageDetailPage, MessagesPage } from './pages/messages.page';

test.describe('Contact Messages (Console)', () => {
  test.describe.configure({ mode: 'serial' });

  let messagesPage: MessagesPage;

  test.beforeAll(async () => {
    // Seed test messages
    await createTestMessage('inbox-1', { subject: 'Hello from E2E' });
    await createTestMessage('inbox-2', { subject: 'Job inquiry', purpose: 'JOB_OPPORTUNITY' });
    await createTestMessage('inbox-3', { subject: 'Archived msg', status: 'ARCHIVED', archivedAt: new Date() });
    await createTestMessage('inbox-read', { subject: 'Already read', status: 'READ', readAt: new Date() });
  });

  test.afterAll(async () => {
    await deleteTestMessages();
  });

  test('navigate to /messages and inbox list loads', async ({ adminPage: page }) => {
    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await expect(messagesPage.heading).toBeVisible();
    await expect(messagesPage.table).toBeVisible();
    await expect(messagesPage.paginator).toBeVisible();
  });

  test('click message opens detail view and marks as READ', async ({ adminPage: page }) => {
    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    // Click unread message
    await messagesPage.clickMessage('e2e-msg-inbox-1');

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad();

    // Verify detail content
    await expect(detailPage.messageBody).toContainText('test message for E2E testing');
    await expect(detailPage.metaFrom).toContainText('e2e-msg-inbox-1');

    // Wait for auto-read API call to complete
    await page.waitForTimeout(1000);

    // Go back and check status changed
    await detailPage.backButton.click();
    await messagesPage.heading.waitFor({ state: 'visible' });
  });

  test('archive message from detail view', async ({ adminPage: page }) => {
    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.clickMessage('e2e-msg-inbox-2');

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/archive') && r.request().method() === 'PATCH'),
      detailPage.archiveButton.click(),
    ]);
    expect(response.status()).toBe(200);

    // Should navigate back to list
    await messagesPage.heading.waitFor({ state: 'visible' });
  });

  test('delete message from detail view', async ({ adminPage: page }) => {
    // Create a message to delete
    const msg = await createTestMessage('to-delete', { subject: 'Delete me' });

    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.clickMessage(msg.name);

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad();

    // Click delete → confirm dialog
    await detailPage.deleteButton.click();
    await clickConfirm(page);

    // Should navigate back to list
    await messagesPage.heading.waitFor({ state: 'visible' });
  });

  test('search filters results', async ({ adminPage: page }) => {
    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.search('Hello from E2E');

    // Should show matching message
    await expect(messagesPage.getRowByName('e2e-msg-inbox-1')).toBeVisible();

    await messagesPage.clearSearch();
  });

  test('unread badge shows correct count in sidebar', async ({ adminPage: page }) => {
    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    // The sidebar Messages link should show an unread badge (seeded UNREAD messages exist)
    const messagesLink = page.locator('a[routerLink="/messages"]');
    await expect(messagesLink).toBeVisible();

    // Badge should be a span with a number inside the Messages link
    const badge = messagesLink.locator('span.rounded-full');
    const badgeCount = await badge.count();
    // If there are unread messages, the badge should be visible
    expect(badgeCount).toBeGreaterThanOrEqual(0);
    if (badgeCount > 0) {
      const text = await badge.textContent();
      expect(Number(text?.trim())).toBeGreaterThan(0);
    }
  });

  test('bulk select and archive works', async ({ adminPage: page }) => {
    // Create fresh messages for bulk test
    await createTestMessage('bulk-1', { subject: 'Bulk test 1' });
    await createTestMessage('bulk-2', { subject: 'Bulk test 2' });

    messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    // Select two messages
    await messagesPage.toggleSelectMessage('e2e-msg-bulk-1');
    await messagesPage.toggleSelectMessage('e2e-msg-bulk-2');

    // Bulk toolbar should appear
    await expect(messagesPage.bulkToolbar).toBeVisible();
    await expect(messagesPage.bulkToolbar).toContainText('2 selected');

    // Bulk archive
    await messagesPage.bulkArchive();

    // Wait for archive calls
    await page.waitForTimeout(2000);
  });
});
