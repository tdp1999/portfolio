import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container, Breadcrumb, ThemeToggle, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import { PRIMARY_ITEMS, SECONDARY_ITEMS } from './ddl-mobile-nav.data';

/**
 * DDL · Mobile nav — design directions for the `< tablet` full-screen nav sheet.
 * Same content as the shipped sheet (primary nav + "elsewhere" links + locale/theme);
 * three visual treatments rendered in phone-width frames for side-by-side comparison.
 * Winner graduates into `landing-header.component.ts`; this page stays as the spec.
 */
@Component({
  selector: 'landing-ddl-mobile-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Breadcrumb, ThemeToggle],
  template: `
    <div class="border-b border-landing-border bg-ink-1/60">
      <landing-container size="wide">
        <div class="py-6">
          <landing-breadcrumb [items]="breadcrumb" class="mb-3 block" />
          <h1 class="font-display text-display-md text-landing-text-300">Mobile nav · design directions</h1>
          <p class="font-sans text-body-md text-landing-text-400 mt-2 max-w-2xl">
            Three looks for the <code>&lt; tablet</code> full-screen nav sheet — same content (primary nav · "elsewhere"
            links · locale + theme), different visual treatment. Compare at phone width and pick one; the winner
            graduates into the header and this page becomes the spec.
          </p>
        </div>
      </landing-container>
    </div>

    <landing-container size="wide">
      <div class="grid gap-8 py-12 grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3">
        <!-- ─── A · Editorial index ─── -->
        <figure class="mn-col">
          <figcaption class="mn-cap">
            <span class="mn-cap__tag">A</span>
            <span class="mn-cap__name">Editorial index</span>
            <span class="mn-cap__note">Mono group eyebrows · numbered 01–04 · arrow on active. Most on-brand.</span>
          </figcaption>
          <div class="mn-phone">
            <div class="mn-sheet">
              <div class="mn-sheet__top">
                <span class="mn-logo">tdp.</span>
                <span class="mn-x">✕</span>
              </div>
              <p class="mn-eyebrow">Menu</p>
              <nav class="mn-a__nav">
                @for (item of primary; track item.label) {
                  <a class="mn-a__row" [class.is-active]="item.active">
                    <span class="mn-a__idx">{{ item.index }}</span>
                    <span class="mn-a__label">{{ item.label }}</span>
                    @if (item.active) {
                      <span class="mn-a__arrow">→</span>
                    }
                  </a>
                }
              </nav>
              <p class="mn-eyebrow mn-eyebrow--mt">Elsewhere</p>
              <div class="mn-secondary">
                @for (s of secondary; track s.label) {
                  <a class="mn-secondary__row">
                    <span>{{ s.label }}</span>
                    <span class="mn-secondary__hint">{{ s.hint }}</span>
                  </a>
                }
              </div>
              <div class="mn-foot">
                <span class="mn-foot__locale">⊕ EN</span>
                <landing-theme-toggle />
              </div>
            </div>
          </div>
        </figure>

        <!-- ─── B · Big type, edge index ─── -->
        <figure class="mn-col">
          <figcaption class="mn-cap">
            <span class="mn-cap__tag">B</span>
            <span class="mn-cap__name">Big type, edge index</span>
            <span class="mn-cap__note"
              >Oversized serif · index pushed to the right edge · secondary as one mono row.</span
            >
          </figcaption>
          <div class="mn-phone">
            <div class="mn-sheet">
              <div class="mn-sheet__top">
                <span class="mn-logo">tdp.</span>
                <span class="mn-x">✕</span>
              </div>
              <nav class="mn-b__nav">
                @for (item of primary; track item.label) {
                  <a class="mn-b__row" [class.is-active]="item.active">
                    <span class="mn-b__label">{{ item.label }}</span>
                    <span class="mn-b__idx">{{ item.index }}</span>
                  </a>
                }
              </nav>
              <p class="mn-b__compact">
                @for (s of secondary; track s.label; let last = $last) {
                  <span class="mn-b__compact-item">{{ s.label }}</span>
                  @if (!last) {
                    <span class="mn-b__dot">·</span>
                  }
                }
              </p>
              <div class="mn-foot mn-foot--ruled">
                <span class="mn-foot__locale">⊕ EN</span>
                <landing-theme-toggle />
              </div>
            </div>
          </div>
        </figure>

        <!-- ─── C · Arrow list, airy ─── -->
        <figure class="mn-col">
          <figcaption class="mn-cap">
            <span class="mn-cap__tag">C · ✓ shipped</span>
            <span class="mn-cap__name">Arrow list, airy</span>
            <span class="mn-cap__note"
              >No numbers · trailing arrow on every link · generous spacing · single MORE eyebrow. This is the direction
              live in the header sheet.</span
            >
          </figcaption>
          <div class="mn-phone">
            <div class="mn-sheet">
              <div class="mn-sheet__top">
                <span class="mn-logo">tdp.</span>
                <span class="mn-x">✕</span>
              </div>
              <nav class="mn-c__nav">
                @for (item of primary; track item.label) {
                  <a class="mn-c__row" [class.is-active]="item.active">
                    <span class="mn-c__label">{{ item.label }}</span>
                    <span class="mn-c__arrow">→</span>
                  </a>
                }
              </nav>
              <p class="mn-eyebrow mn-eyebrow--mt">More</p>
              <div class="mn-secondary">
                @for (s of secondary; track s.label) {
                  <a class="mn-secondary__row">
                    <span>{{ s.label }}</span>
                    <span class="mn-secondary__hint">{{ s.hint }}</span>
                  </a>
                }
              </div>
              <div class="mn-foot">
                <span class="mn-foot__locale">⊕ EN</span>
                <landing-theme-toggle />
              </div>
            </div>
          </div>
        </figure>
      </div>
    </landing-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .mn-col {
        margin: 0;
      }
      .mn-cap {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 16px;
      }
      .mn-cap__tag {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        color: var(--landing-accent);
        letter-spacing: 0.08em;
      }
      .mn-cap__name {
        font-family: var(--landing-font-display);
        font-size: var(--landing-display-sm);
        color: var(--landing-text-300);
      }
      .mn-cap__note {
        font-family: var(--landing-font-sans);
        font-size: var(--landing-body-sm);
        color: var(--landing-text-500);
      }

      /* Phone frame */
      .mn-phone {
        width: 100%;
        max-width: 390px;
        aspect-ratio: 390 / 760;
        border: 1px solid var(--landing-border);
        border-radius: 28px;
        overflow: hidden;
        background-color: var(--landing-ink-0);
        box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.4);
      }
      .mn-sheet {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 24px;
      }
      .mn-sheet__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;
        margin-bottom: 24px;
      }
      .mn-logo {
        font-family: var(--landing-font-display);
        font-weight: 500;
        font-size: var(--landing-body-lg);
        color: var(--landing-text-300);
      }
      .mn-x {
        color: var(--landing-text-400);
        font-size: 18px;
      }
      .mn-eyebrow {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--landing-text-600);
        margin: 0 0 12px;
      }
      .mn-eyebrow--mt {
        margin-top: 28px;
      }

      /* Shared secondary list */
      .mn-secondary {
        display: flex;
        flex-direction: column;
      }
      .mn-secondary__row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 8px 0;
        font-family: var(--landing-font-sans);
        font-size: var(--landing-body-md);
        color: var(--landing-text-400);
      }
      .mn-secondary__hint {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--landing-text-600);
      }

      /* Footer */
      .mn-foot {
        margin-top: auto;
        display: flex;
        align-items: center;
        gap: 16px;
        padding-top: 16px;
      }
      .mn-foot--ruled,
      .mn-foot {
        border-top: 1px solid var(--landing-border);
      }
      .mn-foot__locale {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        color: var(--landing-text-400);
      }

      /* ── A · Editorial index ── */
      .mn-a__row {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        align-items: baseline;
        gap: 12px;
        padding: 8px 0;
      }
      .mn-a__idx {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        color: var(--landing-text-600);
      }
      .mn-a__label {
        font-family: var(--landing-font-display);
        font-weight: 500;
        font-size: var(--landing-display-sm);
        color: var(--landing-text-300);
      }
      .mn-a__row.is-active .mn-a__label,
      .mn-a__row.is-active .mn-a__idx,
      .mn-a__arrow {
        color: var(--landing-accent);
      }

      /* ── B · Big type, edge index ── */
      .mn-b__row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        padding: 6px 0;
      }
      .mn-b__label {
        font-family: var(--landing-font-display);
        font-weight: 500;
        font-size: var(--landing-display-md);
        line-height: var(--landing-display-md-lh);
        color: var(--landing-text-300);
      }
      .mn-b__row.is-active .mn-b__label {
        color: var(--landing-accent);
      }
      .mn-b__idx {
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        color: var(--landing-text-600);
      }
      .mn-b__compact {
        margin: 24px 0 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        text-transform: lowercase;
        line-height: 2;
        color: var(--landing-text-400);
      }
      .mn-b__dot {
        color: var(--landing-text-600);
        margin: 0 6px;
      }

      /* ── C · Arrow list, airy ── */
      .mn-c__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 0;
      }
      .mn-c__label {
        font-family: var(--landing-font-display);
        font-weight: 500;
        font-size: var(--landing-display-sm);
        color: var(--landing-text-300);
      }
      .mn-c__arrow {
        color: var(--landing-text-600);
        font-size: 18px;
      }
      .mn-c__row.is-active .mn-c__label,
      .mn-c__row.is-active .mn-c__arrow {
        color: var(--landing-accent);
      }
    `,
  ],
})
export class DdlMobileNav {
  // ── Properties ─────────────────────────────────────────────────────
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Mobile nav' }];
  readonly primary = PRIMARY_ITEMS;
  readonly secondary = SECONDARY_ITEMS;
}
