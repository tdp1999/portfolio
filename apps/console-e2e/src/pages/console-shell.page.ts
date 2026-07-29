import { type Locator, type Page } from '@playwright/test';

/**
 * The console shell — sidebar navigation and the footer user menu.
 *
 * "Change Password" is **not** a sidebar entry any more. There is no "Settings" group at all:
 * the link moved into a `mat-menu` hanging off the user button in `ui-sidebar-footer`, and it
 * renders only when `hasPassword()` is true — which is exactly what makes it a useful signal
 * for a Google-only account. "Profile", which older specs asserted alongside it, is unrelated:
 * it is a plain sidebar link under the "Portfolio" group.
 *
 * Nothing in the sidebar is unconditional, though: `main-layout.html` wraps every group —
 * Operations, Data Setup and Portfolio alike — in a single `@if (isAdmin())`. A non-admin sees
 * an empty nav, so `navLink*` is never the right way to prove the shell rendered. Use
 * `userMenuTrigger`, which sits in the ungated footer.
 */
export class ConsoleShell {
  readonly sidebar: Locator;
  readonly userMenuTrigger: Locator;
  readonly userMenu: Locator;
  readonly changePasswordItem: Locator;
  readonly logoutItem: Locator;
  readonly logoutAllItem: Locator;

  constructor(readonly page: Page) {
    this.sidebar = page.locator('ui-sidebar');
    // The only `[matMenuTriggerFor]` button in the footer; it has no aria-label, its accessible
    // name is the user's name + email, so target it structurally.
    this.userMenuTrigger = page.locator('ui-sidebar-footer button[aria-haspopup="menu"]');
    this.userMenu = page.locator('.mat-mdc-menu-panel');
    this.changePasswordItem = this.userMenu.getByRole('menuitem', { name: 'Change Password' });
    this.logoutItem = this.userMenu.getByRole('menuitem', { name: 'Logout', exact: true });
    this.logoutAllItem = this.userMenu.getByRole('menuitem', { name: 'Logout All Devices' });
  }

  /**
   * Sidebar link by route. **Prefer this over `navLink`.**
   *
   * The label is never the whole accessible name, in two independent ways. Every entry leads
   * with `<mat-icon>`, whose ligature text is part of the computed name — the Media link reads
   * as "perm_mediaMedia", the Profile link as "person Profile". And the Messages entry appends
   * an unread badge, so its name becomes "Messages 3" exactly when there is something to count.
   * An exact match on the visible label therefore matches nothing at all.
   */
  navLinkByRoute(route: string): Locator {
    return this.sidebar.locator(`a[routerLink="${route}"]`);
  }

  /**
   * Sidebar link by visible label. Deliberately **not** exact — see `navLinkByRoute` for why an
   * exact match can never succeed. Use this only where the route is not the thing under test.
   */
  navLink(label: string): Locator {
    return this.sidebar.getByRole('link', { name: label });
  }

  async openUserMenu(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.userMenu.waitFor({ state: 'visible', timeout: 5_000 });
  }
}
