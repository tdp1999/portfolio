import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Shared locators for every console page built on `console-section-tabs`.
 *
 * `/profile`, `/skills/new`, `/skills/:id/edit`, `/projects/new` and `/projects/:id/edit`
 * all render the same shell: a rail of section tabs on the left and a stack of
 * `console-section-card`s whose bodies are gated with
 * `[hidden]="!showAll() && activeId() !== '<id>'"`. Two consequences drive everything here:
 *
 * 1. A gated section resolves as a locator but never becomes visible, so a spec that forgets
 *    to activate it fails as a 30s click timeout rather than as "element not found".
 * 2. `section-tabs.html` renders each tab twice — once in the laptop+ vertical rail and once
 *    in the sub-laptop horizontal strip — and both stay in the DOM at every viewport. An
 *    unscoped `getByRole('button')` therefore matches two nodes and trips strict mode.
 */

export class SectionCard {
  readonly root: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    readonly page: Page,
    readonly sectionId: string
  ) {
    this.root = page.locator(`section#${sectionId}`);
    this.saveButton = this.root.getByRole('button', { name: 'Save section' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }

  /**
   * Click "Save section" and wait for the PATCH that section fires.
   *
   * Named `saveSection`, not `save`, on purpose. The routed-form POMs expose
   * `save(method: 'POST' | 'PATCH' | 'PUT')`, and while both took a single string the two were
   * trivially confusable — `identity.save('PATCH')` type-checked, then hung for the full 30s
   * because `url().includes('PATCH')` can never be true. Take the endpoint, e.g.
   * `/admin/profile/identity`.
   *
   * Fails on a non-2xx rather than returning it. `waitForResponse` is satisfied by *any* matching
   * response, a rejected 400 included, so a save that the server refused used to sail through here
   * and resurface much later as "the value did not persist" — with the actual reason discarded.
   */
  async saveSection(endpoint: string): Promise<number> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes(endpoint) && r.request().method() === 'PATCH'
    );
    await this.saveButton.click();

    const response = await responsePromise;
    const status = response.status();
    if (status >= 300) {
      throw new Error(`PATCH ${endpoint} failed with ${status}: ${await response.text()}`);
    }
    return status;
  }

  /**
   * A control inside this section, by its label.
   *
   * Pass the label **in full**, including any locale suffix. `getByLabel` is a substring match,
   * and `console-translatable-group` renders each bilingual field twice — "Full Name (EN)" and
   * "Full Name (VI)" — so a shorthand like `field('Name')` resolves to two elements and trips
   * strict mode rather than picking the obvious one.
   */
  field(label: string): Locator {
    return this.root.getByLabel(label);
  }
}

/** Every locator scopes to `nav.section-tabs__rail` — see the duplicate-render note above. */
export class SectionTabs {
  readonly nav: Locator;
  readonly showAllToggle: Locator;

  constructor(readonly page: Page) {
    this.nav = page.locator('nav.section-tabs__rail');
    this.showAllToggle = page.locator('.section-tabs__showall input[type="checkbox"]');
  }

  /** A rail item, matched on its label span so the status glyph is not part of the name. */
  item(label: string): Locator {
    return this.nav
      .locator('button.section-tabs__item')
      .filter({ has: this.page.locator('.section-tabs__label', { hasText: new RegExp(`^${label}$`) }) });
  }

  /** Assert which rail item has `aria-current="true"`. */
  async expectActive(label: string): Promise<void> {
    await expect(this.item(label)).toHaveAttribute('aria-current', 'true');
  }

  /** Get the status icon text (✓, ●, ⚠, ○) for a rail item. */
  iconFor(label: string): Locator {
    return this.item(label).locator('.section-tabs__icon');
  }

  async selectAll(): Promise<void> {
    if (!(await this.showAllToggle.isChecked())) await this.showAllToggle.check();
  }

  async selectNone(): Promise<void> {
    if (await this.showAllToggle.isChecked()) await this.showAllToggle.uncheck();
  }
}

/**
 * Base for every routed console form, tabbed or not.
 *
 * What they all share is the submit control. Each form's own `<button type="submit">` is
 * `class="hidden" aria-hidden="true"` and unreachable by role on purpose; the real one lives in
 * `console-sticky-save-bar` and is labelled **"Save changes"**. Specs written against the old
 * dialogs looked for a button named "Save", "Create" or "Update" — none of those exist any more.
 *
 * Cards in `saveMode="atomic"` also have no per-section footer, so "Save section" exists only on
 * pages that opt into `saveMode="per-section"` (currently just `/profile`).
 */
export abstract class StickyFormPage {
  readonly saveBar: Locator;
  readonly saveButton: Locator;
  readonly discardButton: Locator;
  readonly unsavedIndicator: Locator;

  constructor(readonly page: Page) {
    this.saveBar = page.locator('.sticky-save-bar');
    this.saveButton = this.saveBar.getByRole('button', { name: 'Save changes' });
    // Both only render while the form is dirty.
    this.discardButton = this.saveBar.getByRole('button', { name: 'Discard' });
    this.unsavedIndicator = this.saveBar.getByText('Unsaved changes');
  }

  /**
   * Click Save changes and wait for the write it should trigger.
   *
   * Named separately from `save` so subclasses can expose a `save(method)` that bakes in their
   * own endpoint without fighting this signature.
   */
  async saveAndWait(endpoint: string, method: 'POST' | 'PATCH' | 'PUT'): Promise<number> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes(endpoint) && r.request().method() === method
    );
    await this.saveButton.click();
    return (await responsePromise).status();
  }

  /**
   * The `<mat-error>` belonging to one control, scoped to that control's own `mat-form-field`.
   *
   * Material keeps an error in the DOM only while its field is in an error state, so an
   * unscoped `mat-error` locator picks up whichever other field happens to be complaining.
   */
  errorFor(controlName: string): Locator {
    return this.page
      .locator('mat-form-field')
      .filter({ has: this.page.locator(`[formControlName="${controlName}"]`) })
      .locator('mat-error');
  }
}

/**
 * Base for the create/edit form pages that additionally carry `console-section-tabs`.
 *
 * `SECTION_LABELS` is the subclass's map from `console-section-card` `id` to the rail label
 * declared in the component's `sections` array; keeping the two in one place is what lets
 * `activate()` take a section id (stable, matches the markup) instead of a display label.
 */
export abstract class SectionFormPage<TSectionId extends string> extends StickyFormPage {
  readonly rail: SectionTabs;

  protected abstract readonly labels: Readonly<Record<TSectionId, string>>;

  constructor(page: Page) {
    super(page);
    this.rail = new SectionTabs(page);
  }

  section(sectionId: TSectionId): Locator {
    return this.page.locator(`section#${sectionId}`);
  }

  /** Bring one section on screen and wait for it. Call before touching anything inside. */
  async activate(sectionId: TSectionId): Promise<Locator> {
    const section = this.section(sectionId);
    if (await section.isVisible()) return section;

    await this.rail.item(this.labels[sectionId]).click();
    await section.waitFor({ state: 'visible', timeout: 10_000 });
    return section;
  }

  /** Turn on "Show all sections" so specs can reason across sections at once. */
  async showAllSections(): Promise<void> {
    await this.rail.selectAll();
  }
}
