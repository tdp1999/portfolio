import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InPageSection } from './section.types';

/**
 * Inline "On this page" table of contents — a static, in-flow block of section
 * jump-links for narrow viewports (mobile/tablet) where the sticky
 * `landing-toc-sidebar` rail has no room.
 *
 * No scrollspy / active state by design: it's a jump list, not a wayfinding rail
 * (so it stays cheap and needs no `LandingScrollspyService`). Pair it with
 * `landing-toc-sidebar` shown at laptop+ — the consumer toggles which is visible
 * per breakpoint via CSS.
 *
 * Supports h2/h3/h4 nesting via `section.level` (12→16/32px indent), matching the
 * sidebar's depth model.
 *
 * The component owns only the "card" (dashed box + label + list + link styling).
 * Width / outer placement is the consumer's concern — drop it inside a reading
 * column and it fills that column.
 *
 * ```html
 * <landing-toc-inline [sections]="sections()" [label]="tocLabel()" />
 * ```
 */
@Component({
  selector: 'landing-toc-inline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="toc-inline" [attr.aria-label]="label()">
      <p class="toc-inline__label">{{ label() }}</p>
      <ol class="toc-inline__list">
        @for (s of sections(); track s.id) {
          <li [attr.data-level]="s.level ?? 2">
            <!-- routerLink [] = current route (relative), fragment = anchor;
                 preserve keeps query params (e.g. legal pages' ?lang=vi). -->
            <a [routerLink]="[]" [fragment]="s.id" queryParamsHandling="preserve">{{ s.title }}</a>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }

    .toc-inline {
      padding: 16px 20px;
      border: 1px dashed var(--landing-border);
      border-radius: 4px;
      background: var(--landing-ink-1);
    }

    .toc-inline__label {
      margin: 0 0 8px;
      font-family: var(--landing-font-mono);
      font-size: var(--landing-mono-sm);
      line-height: var(--landing-mono-sm-lh);
      letter-spacing: var(--landing-tracking-mono);
      text-transform: uppercase;
      color: var(--landing-text-500);
    }

    .toc-inline__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
    }
    .toc-inline__list li[data-level='3'] {
      padding-left: 16px;
    }
    .toc-inline__list li[data-level='4'] {
      padding-left: 32px;
    }
    .toc-inline__list a {
      color: var(--landing-text-300);
      text-decoration: none;
    }
    .toc-inline__list a:hover {
      color: var(--landing-accent);
    }
  `,
})
export class LandingTocInlineComponent {
  readonly sections = input.required<readonly InPageSection[]>();
  readonly label = input('On this page');
}
