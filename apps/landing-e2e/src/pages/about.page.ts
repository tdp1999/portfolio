import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the `/about` page.
 *
 * Composition of the page (see `libs/landing/feature-about/.../feature-about.html`):
 *   - hero (page-shell hero slot — H1 + sub-paragraph + meta strip)
 *   - §01  `#experience`   — tabs (desktop) / accordion (mobile)
 *   - §02  `#how-i-think`  — manifesto principles
 *   - §03  `#failures`     — three clinical essays
 *   - §04  `#cta`          — next-step links
 *   - floating pill nav (sticky)
 *
 * Locators prefer semantic roles per the project AQA convention; CSS
 * selectors are used only where the markup exposes no role (eyebrows,
 * raw `<section id>` anchors, the accordion trigger which is not a button
 * with an accessible name distinct from its label content).
 */
export class AboutPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/about');
    await this.page.waitForURL((url) => url.pathname === '/about');
    // Wait for the hero H1 — proxy for "page hydrated + first paint ready".
    await this.heroHeading.waitFor({ state: 'visible' });
  }

  // ── Hero ────────────────────────────────────────────────────────────

  get heroHeading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  // ── Sections (anchor ids) ───────────────────────────────────────────

  get experienceSection(): Locator {
    return this.page.locator('section#experience');
  }
  get howIThinkSection(): Locator {
    return this.page.locator('section#how-i-think');
  }
  get failuresSection(): Locator {
    return this.page.locator('section#failures');
  }
  get ctaSection(): Locator {
    return this.page.locator('section#cta');
  }

  // ── Experience tabs / accordion ─────────────────────────────────────

  /** Vertical tablist (desktop). Empty selection on mobile (the
   *  accordion variant uses h3 > button instead of role=tab). */
  get experienceTabs(): Locator {
    return this.experienceSection.getByRole('tab');
  }

  /** Currently-visible experience panel (one is shown at a time;
   *  the others are hidden via `[hidden]`). */
  get visibleExperiencePanel(): Locator {
    return this.experienceSection
      .getByRole('tabpanel')
      .or(this.experienceSection.locator('.exp-acc__panel:not([hidden])'));
  }

  experienceTab(companyName: string): Locator {
    return this.experienceTabs.filter({ hasText: companyName });
  }

  /** Mobile accordion triggers — `<h3><button class="exp-acc__trigger">`. */
  get accordionTriggers(): Locator {
    return this.experienceSection.locator('.exp-acc__trigger');
  }

  accordionTrigger(companyName: string): Locator {
    return this.accordionTriggers.filter({ hasText: companyName });
  }

  // ── Manifesto ───────────────────────────────────────────────────────

  /** Each list item — ordered. `nth(0)` is the first principle. */
  get principles(): Locator {
    return this.howIThinkSection.locator('ol.hit__list > li.hit__item');
  }

  // ── Failures ────────────────────────────────────────────────────────

  /** Three clinical essays. */
  get failureCards(): Locator {
    return this.failuresSection.locator('ol.afa__list > li.afa__card');
  }

  // ── CTA ─────────────────────────────────────────────────────────────

  /** All CTA links in the §04 section (Contact + any social/CV that exist). */
  get ctaLinks(): Locator {
    return this.ctaSection.getByRole('link');
  }

  get contactLink(): Locator {
    return this.ctaLinks.filter({ hasText: /Get in touch|Liên hệ/ });
  }

  // ── Locale switcher (lives in the global header) ────────────────────

  /** Pre-seed the locale in `localStorage` so the next `goto()` boots in that
   *  language. The dropdown UX (which lives in the global header `<landing-
   *  select>`) is exercised on `/ddl/language-switcher`; here we just want the
   *  page to render in `locale` so we can assert on its content. */
  async presetLocale(locale: 'en' | 'vi'): Promise<void> {
    await this.page.addInitScript((loc) => {
      try {
        localStorage.setItem('landing_locale', loc);
      } catch {
        /* private mode — non-fatal */
      }
    }, locale);
  }
}
