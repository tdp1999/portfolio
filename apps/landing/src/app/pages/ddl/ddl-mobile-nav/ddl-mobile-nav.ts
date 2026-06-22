import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeToggle } from '@portfolio/landing/shared/ui';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import { MOBILE_NAV_VARIANTS, PRIMARY_ITEMS, SECONDARY_ITEMS } from './ddl-mobile-nav.data';

/**
 * DDL · Mobile nav — design directions for the `< tablet` full-screen nav sheet.
 * Same content as the shipped sheet (primary nav + "elsewhere" links + locale/theme);
 * three visual treatments rendered full-bleed (pop each to full width to judge at
 * true phone/viewport scale) for side-by-side comparison. Still exploring — no winner.
 */
@Component({
  selector: 'landing-ddl-mobile-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ThemeToggle, DdlDocPage, DdlSection, DdlDecisionRecord, DdlStage],
  template: `
    <landing-ddl-doc-page slug="mobile-nav" [width]="'wide'">
      <p class="mn-lead font-sans text-body-md text-landing-text-400 max-w-2xl">
        Three looks for the <code>&lt; tablet</code> full-screen nav sheet — same content (primary nav · "elsewhere"
        links · locale + theme), different visual treatment. Each renders full-bleed; pop one to full width to judge it
        at true phone/viewport scale, then pick. Still exploring — none has won yet.
      </p>

      <landing-ddl-decision-record
        [variants]="variants"
        [summary]="
          'Three visual treatments for the &lt; tablet full-screen nav sheet — editorial index, big-type, and airy arrow list — same content throughout. None has won; the call is a taste/brand judgement best made at real phone width, so pop each look full-screen before deciding. The winner graduates into landing-header and this page becomes its spec.'
        "
      />

      <!-- ═══ A · Editorial index ═════════════════════════════════════ -->
      <landing-ddl-section anchor="a-editorial-index" heading="A — Editorial index">
        <landing-ddl-stage width="full" label="A — editorial index sheet">
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
        </landing-ddl-stage>
      </landing-ddl-section>

      <!-- ═══ B · Big type, edge index ════════════════════════════════ -->
      <landing-ddl-section anchor="b-big-type" heading="B — Big type, edge index">
        <landing-ddl-stage width="full" label="B — big type, edge index sheet">
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
        </landing-ddl-stage>
      </landing-ddl-section>

      <!-- ═══ C · Arrow list, airy ════════════════════════════════════ -->
      <landing-ddl-section anchor="c-arrow-list-airy" heading="C — Arrow list, airy">
        <landing-ddl-stage width="full" label="C — arrow list, airy sheet">
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
        </landing-ddl-stage>
      </landing-ddl-section>
    </landing-ddl-doc-page>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* Full-bleed nav sheet — fills the stage; content held to a phone measure
         and centered, the way the real header sheet pads itself. */
      .mn-sheet {
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
        min-height: 560px;
        display: flex;
        flex-direction: column;
        padding: 24px;
        background-color: var(--landing-ink-0);
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
        font-size: 20px;
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
        font-size: 20px;
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
  protected readonly variants = MOBILE_NAV_VARIANTS;
  readonly primary = PRIMARY_ITEMS;
  readonly secondary = SECONDARY_ITEMS;
}
