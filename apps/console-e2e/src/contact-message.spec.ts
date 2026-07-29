import { expect, test } from './fixtures/auth.fixture';
import { createTestMessage, deleteTestMessages } from './helpers/db-contact-messages';
import { clickConfirm } from './helpers/dialog';
import { MessageDetailPage, MessagesPage } from './pages/messages.page';
import { ConsoleShell } from './pages/console-shell.page';

/**
 * The detail view's `<h1>` is the sender's name, not a fixed "Message Detail" title, and
 * Mark Unread / Archive / Delete moved into a `mat-menu` behind "More actions" — only Reply is
 * still a top-level control. Both are handled in `MessageDetailPage`.
 */
test.describe('Contact Messages (Console)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await deleteTestMessages();
    await createTestMessage('inbox-1', { subject: 'Hello from E2E' });
    await createTestMessage('inbox-2', { subject: 'Job inquiry', purpose: 'JOB_OPPORTUNITY' });
    await createTestMessage('inbox-3', { subject: 'Archived msg', status: 'ARCHIVED', archivedAt: new Date() });
    await createTestMessage('inbox-read', { subject: 'Already read', status: 'READ', readAt: new Date() });
  });

  test.afterAll(async () => {
    await deleteTestMessages();
  });

  test('navigate to /messages and inbox list loads', async ({ adminPage: page }) => {
    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await expect(messagesPage.heading).toBeVisible();
    await expect(messagesPage.table).toBeVisible();
    await expect(messagesPage.paginator).toBeVisible();
  });

  test('clicking a message opens its detail view', async ({ adminPage: page }) => {
    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.clickMessage('e2e-msg-inbox-1');

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad('e2e-msg-inbox-1');

    await expect(detailPage.messageBody).toContainText('test message for E2E testing');
    // The sender's email is a meta row; the name is the heading, and there is no "From" row.
    await expect(detailPage.metaValue('Email')).toContainText('e2e-msg-inbox-1');
    await expect(detailPage.metaValue('Subject')).toHaveText('Hello from E2E');
  });

  test('opening a message marks it READ', async ({ adminPage: page }) => {
    // Its own message, seeded here.
    //
    // This describe is `serial`, and the test above already opens `inbox-1` — which marks it READ.
    // Re-opening an already-read message fires no PATCH at all, so waiting for one burned the full
    // 30s timeout while the app was behaving correctly. The assertion only means anything on a
    // message that is unread at the moment it is opened.
    const fresh = await createTestMessage('read-once', { subject: 'Mark me read' });

    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    // The detail view fires the read call itself on load — wait for it instead of a fixed sleep.
    const readCall = page.waitForResponse(
      (r) => r.url().includes('/api/contact-messages') && r.request().method() === 'PATCH'
    );
    await messagesPage.clickMessage(fresh.name);
    expect((await readCall).status()).toBe(200);

    const detailPage = new MessageDetailPage(page);
    await detailPage.backLink.click();
    await expect(messagesPage.heading).toBeVisible();
  });

  test('archive a message from the overflow menu', async ({ adminPage: page }) => {
    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.clickMessage('e2e-msg-inbox-2');

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad('e2e-msg-inbox-2');
    await detailPage.openMoreActions();

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/archive') && r.request().method() === 'PATCH'),
      detailPage.archiveItem.click(),
    ]);
    expect(response.status()).toBe(200);

    await expect(messagesPage.heading).toBeVisible();
  });

  test('delete a message from the overflow menu', async ({ adminPage: page }) => {
    const msg = await createTestMessage('to-delete', { subject: 'Delete me' });

    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.clickMessage(msg.name);

    const detailPage = new MessageDetailPage(page);
    await detailPage.waitForLoad(msg.name);
    await detailPage.openMoreActions();
    await detailPage.deleteItem.click();
    await clickConfirm(page);

    await expect(messagesPage.heading).toBeVisible();
    await expect(messagesPage.getRowByName(msg.name)).toHaveCount(0);
  });

  test('search filters results', async ({ adminPage: page }) => {
    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.search('Hello from E2E');

    await expect(messagesPage.getRowByName('e2e-msg-inbox-1')).toBeVisible();
    await expect(messagesPage.getRowByName('e2e-msg-inbox-read')).toHaveCount(0);

    await messagesPage.clearSearch();
    await expect(messagesPage.getRowByName('e2e-msg-inbox-read')).toBeVisible();
  });

  test('unread badge shows a count on the sidebar Messages link', async ({ adminPage: page }) => {
    // Seed a guaranteed-unread message so the badge cannot be legitimately absent — the old
    // version of this test passed whether or not the badge rendered, which proved nothing.
    await createTestMessage('badge-unread', { subject: 'Badge me' });

    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    const shell = new ConsoleShell(page);
    // By route, not label: the badge is inside the link, so its accessible name is
    // "Messages 3" — an exact match on "Messages" fails exactly when there is a count.
    const badge = shell.navLinkByRoute('/messages').locator('span.rounded-full');

    await expect(badge).toBeVisible();
    expect(Number((await badge.textContent())?.trim())).toBeGreaterThan(0);
  });

  test('bulk select and archive works', async ({ adminPage: page }) => {
    await createTestMessage('bulk-1', { subject: 'Bulk test 1' });
    await createTestMessage('bulk-2', { subject: 'Bulk test 2' });

    const messagesPage = new MessagesPage(page);
    await messagesPage.goto();

    await messagesPage.toggleSelectMessage('e2e-msg-bulk-1');
    await messagesPage.toggleSelectMessage('e2e-msg-bulk-2');

    await expect(messagesPage.bulkToolbar).toBeVisible();
    await expect(messagesPage.bulkToolbar).toContainText('2 selected');

    const archiveCall = page.waitForResponse((r) => r.url().includes('/archive') && r.request().method() === 'PATCH');
    await messagesPage.bulkArchive();
    expect((await archiveCall).status()).toBe(200);

    // The toolbar clears once the selection is applied.
    await expect(messagesPage.bulkToolbar).toBeHidden();
  });
});
