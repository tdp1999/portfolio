import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for 'S6 Trang tra cứu' (`/medicine-cabinet`), rendered in VI.
 *
 * Locators follow the DOM contract in
 * `libs/landing/feature-medicine-cabinet/src/lib/medicine-lookup.page/medicine-lookup.page.spec.ts`:
 * a search box, chips as `aria-pressed` buttons, `person-group` and `lookup-item` test ids, and an
 * `edit-link` per item.
 */
export class MedicineLookupPage {
  constructor(private readonly page: Page) {}

  async goto(query = ''): Promise<void> {
    await this.page.goto(`/medicine-cabinet${query}`);
  }

  async waitForResults(): Promise<void> {
    await this.results.waitFor({ state: 'visible' });
  }

  get searchBox(): Locator {
    return this.page.getByRole('searchbox');
  }

  get results(): Locator {
    return this.page.getByTestId('lookup-results');
  }

  get emptyResult(): Locator {
    return this.page.getByText('Không tìm thấy sản phẩm nào');
  }

  chip(label: string): Locator {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  /** The item whose primary name is `primary`. */
  item(primary: string): Locator {
    return this.page
      .getByTestId('lookup-item')
      .filter({ has: this.page.getByTestId('item-primary').getByText(primary, { exact: true }) });
  }

  async search(keyword: string): Promise<void> {
    await this.searchBox.fill(keyword);
    await expect(this.page).toHaveURL(new RegExp(`[?&]q=${encodeURIComponent(keyword)}`));
  }

  async selectChip(label: string): Promise<void> {
    await this.chip(label).click();
    await expect(this.chip(label)).toHaveAttribute('aria-pressed', 'true');
  }

  async edit(primary: string): Promise<void> {
    await this.item(primary).getByTestId('edit-link').click();
  }

  async scrollY(): Promise<number> {
    return this.page.evaluate(() => window.scrollY);
  }
}
