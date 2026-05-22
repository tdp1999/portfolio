import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { LandingBreadcrumbComponent, type BreadcrumbItem } from '../breadcrumb';
import { ContainerComponent, type ContainerSize } from '../container';
import { LandingPageHeroComponent } from '../page-hero';

/**
 * Canonical shell for every landing **feature page** (subpage): `/about`,
 * `/projects`, `/blog`, `/uses`, `/contact`, `/colophon`, `/privacy`, `/terms`.
 * Home is NOT a feature page — it has its own bespoke hero composition.
 *
 * Structure:
 * ```
 * <article>
 *   <header>            ← breadcrumb + page-hero + (optional) meta strip
 *     <landing-container>
 *       <landing-breadcrumb />
 *       <landing-page-hero> heading + lede </landing-page-hero>
 *       <div meta>        ← projected, optional
 *     </landing-container>
 *   </header>
 *   <div body>            ← default slot — caller owns section wrappers
 *   <footer>              ← projected, optional
 * </article>
 * ```
 *
 * ```html
 * <landing-page-shell [breadcrumb]="breadcrumb" align="center">
 *   <span hero-heading><em>About</em>.</span>
 *   <p hero-lede>Work history, principles, and what I'm shipping now.</p>
 *   <p meta-strip>Last updated <time datetime="2026-05-22">May 2026</time>.</p>
 *
 *   <section aria-labelledby="exp-h">
 *     <landing-container>
 *       <h2 id="exp-h">Experience</h2>
 *       …
 *     </landing-container>
 *   </section>
 *
 *   <div page-footer>
 *     <a href="/contact">Get in touch →</a>
 *   </div>
 * </landing-page-shell>
 * ```
 *
 * **Slots**:
 * - `[hero-heading]` — heading content (wrap accent words in `<em>`).
 * - `[hero-lede]` — lede paragraph.
 * - `[meta-strip]` — optional metadata line (last-updated, multi-fact strip,
 *   status row). Hidden when empty.
 * - default (no selector) — body sections. Caller writes one or more
 *   `<section aria-labelledby="…">` blocks, each with their own
 *   `<landing-container>` if width should differ.
 * - `[page-footer]` — optional `<footer>` content (final CTA, related links).
 *
 * **Inputs**: `breadcrumb` (omit on top-level pages — e.g. `/about` shows
 * `Home / About`, but if there's nothing above it, pass `null`),
 * `align`, `size`, `accentFirst` (page-hero passthrough — controls HEADER
 * block only; body content always reads left-aligned), `containerSize`
 * (header block container — default `content` / max-w-6xl).
 *
 * **No eyebrow.** The shell intentionally omits `eyebrowLabel` — eyebrow
 * doesn't belong on feature-page headers. (Eyebrow stays available on the
 * raw `landing-page-hero` for non-page contexts like DDL stages.)
 */
@Component({
  selector: 'landing-page-shell',
  standalone: true,
  imports: [LandingBreadcrumbComponent, ContainerComponent, LandingPageHeroComponent],
  template: `
    <article class="lps" [class.lps--align-left]="align() === 'left'">
      <header class="lps__header">
        <landing-container [size]="containerSize()">
          @if (breadcrumb()?.length) {
            <div class="lps__breadcrumb">
              <landing-breadcrumb [items]="breadcrumb()!" />
            </div>
          }

          <landing-page-hero [accentFirst]="accentFirst()" [align]="align()" [size]="size()">
            <!-- ngProjectAs re-marks forwarded content so the inner component
                 (page-hero) re-matches it against its own slot selectors. Without
                 it, Angular routes both forwarded blocks into page-hero's default
                 slot — the lede ends up inside <h1>, losing italic-Newsreader. -->
            <ng-content select="[hero-heading]" ngProjectAs="[hero-heading]" />
            <ng-content select="[hero-lede]" ngProjectAs="[hero-lede]" />
          </landing-page-hero>

          <div class="lps__meta">
            <ng-content select="[meta-strip]" />
          </div>
        </landing-container>
      </header>

      <div class="lps__body">
        <ng-content />
      </div>

      <div class="lps__footer">
        <ng-content select="[page-footer]" />
      </div>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ═══ Header block ═══════════════════════════════════════════════════
         Generous top padding (page enters under fixed site header), modest
         bottom (gap to first body section). All multiples of 4. */
      .lps__header {
        padding-top: 64px;
        padding-bottom: 48px;
      }
      @media (min-width: 768px) {
        .lps__header {
          padding-top: 96px;
          padding-bottom: 64px;
        }
      }
      @media (min-width: 1024px) {
        .lps__header {
          padding-top: 128px;
          padding-bottom: 64px;
        }
      }

      .lps__breadcrumb {
        margin-bottom: 32px;
      }
      .lps:not(.lps--align-left) .lps__breadcrumb {
        display: flex;
        justify-content: center;
      }

      /* ═══ Meta strip slot ════════════════════════════════════════════════
         Collapses when caller projects nothing. Default typography lives here
         so each page doesn't redeclare it. */
      .lps__meta {
        margin-top: 24px;
        text-align: center;
      }
      .lps--align-left .lps__meta {
        text-align: left;
      }
      .lps__meta:empty {
        display: none;
      }

      /* Default styling for a single-line meta paragraph (privacy/terms/uses). */
      .lps__meta [meta-strip] {
        margin: 0;
        font-family: var(--landing-font-mono);
        font-size: var(--landing-mono-sm);
        line-height: var(--landing-mono-sm-lh);
        letter-spacing: var(--landing-tracking-mono);
        text-transform: uppercase;
        color: var(--landing-text-500);
      }
      .lps__meta [meta-strip] time {
        color: var(--landing-text-400);
      }

      /* Multi-fact strip variant (about): caller projects a <ul meta-strip>. */
      .lps__meta ul[meta-strip] {
        list-style: none;
        margin: 0;
        padding: 0;
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px 16px;
        justify-content: inherit;
      }
      .lps__meta ul[meta-strip] li {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .lps__meta ul[meta-strip] li + li::before {
        content: '·';
        margin-right: 8px;
        color: var(--landing-text-600);
      }

      /* ═══ Body ═══════════════════════════════════════════════════════════
         Caller owns section structure. Shell stays out of the way — each
         <section> child manages its own padding + container.
         Explicit text-align:left so the header's center alignment never
         cascades into body content. */
      .lps__body {
        display: block;
        text-align: left;
      }

      /* ═══ Footer slot ════════════════════════════════════════════════════ */
      .lps__footer:empty {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // None: meta-strip styles target projected content, which sits outside
  // Angular's scoped styles. BEM-prefixed (.lps*) keeps collisions away.
  encapsulation: ViewEncapsulation.None,
})
export class LandingPageShellComponent {
  readonly breadcrumb = input<readonly BreadcrumbItem[] | null>(null);
  readonly accentFirst = input(true);
  /** Header-block alignment. Body content stays left-aligned regardless. */
  readonly align = input<'left' | 'center'>('center');
  readonly size = input<'lg' | 'md' | 'sm'>('md');
  readonly containerSize = input<ContainerSize>('content');
}
