import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LandingScrollspyService } from './landing-scrollspy.service';
import { InPageSection } from './section.types';

/**
 * Sticky table-of-contents sidebar with scrollspy active highlighting.
 *
 * Supports h2/h3/h4 nesting via `section.level` — indentation grows 12px per level.
 *
 * Long content: the nav is internally scrollable with `max-height: calc(100vh - 96px - 16px)`
 * so a long TOC doesn't get clipped by the viewport when sticky-pinned. Active item is auto
 * scrolled into view when scrollspy moves between sections.
 *
 * Active indicator: vertical rail (border-left) + horizontal elbow connectors at level changes
 * form ONE continuous thread. Active item colors its own rail + elbow accent, transitioning in
 * smoothly (240ms) so the highlight appears to "flow" along the thread as scrollspy advances.
 *
 * Usage:
 * ```html
 * <landing-toc-sidebar [sections]="sections" label="On this page" />
 * ```
 *
 * Requires `LandingScrollspyService` provided in the parent. Page must register sections via
 * `scrollspy.setSections(sections)` in its constructor.
 */
@Component({
  selector: 'landing-toc-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: {
    style: 'display: block;',
  },
  template: `
    <nav class="toc" [attr.aria-label]="label()">
      <p class="toc__label font-mono text-mono-sm uppercase tracking-[0.06em] text-landing-text-500 mb-3">
        {{ label() }}
      </p>
      <ul #list class="toc__list">
        @for (s of items(); track s.id) {
          <li
            class="toc__item"
            [attr.data-level]="s.level"
            [style.--toc-indent.px]="s.indent"
            [style.--toc-prev-indent.px]="s.prevIndent"
          >
            <a
              [routerLink]="[]"
              [fragment]="s.id"
              [attr.data-section-id]="s.id"
              [attr.aria-current]="active() === s.id ? 'location' : null"
              class="toc__link"
              [class.toc__link--active]="active() === s.id"
            >
              {{ s.title }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      /* Position sticky on the host so the scroll container has a stable height. */
      position: sticky;
      top: 96px;
      max-height: calc(100vh - 96px - 16px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--landing-border) transparent;
    }
    :host::-webkit-scrollbar {
      width: 4px;
    }
    :host::-webkit-scrollbar-track {
      background: transparent;
    }
    :host::-webkit-scrollbar-thumb {
      background: var(--landing-border);
      border-radius: 2px;
    }
    :host::-webkit-scrollbar-thumb:hover {
      background: var(--landing-text-500);
    }

    .toc__list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .toc__item {
      position: relative;
    }

    /* "Elbow" connector: a 1px horizontal stroke at the TOP of each item that
       bridges the previous item's rail (border-left at --toc-prev-indent) to
       this item's rail (border-left at --toc-indent). When the two indents
       differ (level change), this elbow turns the segmented rails into one
       continuous thread. When this item is active, the elbow inherits the
       accent color too — so the accent flows along the thread as scrollspy
       moves through nested sections. */
    .toc__item:not(:first-child)::before {
      content: '';
      position: absolute;
      top: 0;
      left: min(var(--toc-indent, 0px), var(--toc-prev-indent, 0px));
      width: calc(
        max(var(--toc-indent, 0px), var(--toc-prev-indent, 0px)) - min(
            var(--toc-indent, 0px),
            var(--toc-prev-indent, 0px)
          ) +
          1px
      );
      height: 1px;
      background-color: var(--landing-border);
      transition: background-color 240ms ease;
    }

    .toc__item:has(.toc__link--active)::before {
      background-color: var(--landing-accent);
    }

    /* Each item carries its OWN vertical rail at --toc-indent. Combined with
       the elbow above, the rails read as one continuous thread that steps
       inward with depth. Active state only changes COLOR (not width) so the
       accent transitions smoothly without any layout jiggle. */
    .toc__link {
      display: block;
      margin-left: var(--toc-indent, 0px);
      padding-block: 6px;
      padding-left: 12px;
      border-left: 1px solid var(--landing-border);
      font-family: var(--landing-font-body);
      font-size: var(--landing-body-sm);
      line-height: var(--landing-body-sm-lh);
      color: var(--landing-text-500);
      text-decoration: none;
      transition:
        color 240ms ease,
        border-left-color 240ms ease;
    }

    .toc__link:hover {
      color: var(--landing-text-300);
    }

    .toc__link--active {
      color: var(--landing-accent);
      border-left-color: var(--landing-accent);
      font-weight: 500;
    }
  `,
})
export class LandingTocSidebarComponent {
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sections = input.required<readonly InPageSection[]>();
  readonly label = input('On this page');

  readonly active = computed(() => this.scrollspy.active());

  /** Precomputed item descriptors with resolved level + indent + prev-indent —
   *  avoids method calls in the template `@for`. */
  protected readonly items = computed(() => {
    const list = this.sections();
    return list.map((s, i) => {
      const level = s.level ?? 2;
      const indent = indentForLevel(level);
      const prevLevel = list[i - 1]?.level ?? level;
      return { id: s.id, title: s.title, level, indent, prevIndent: indentForLevel(prevLevel) };
    });
  });

  private readonly listEl = viewChild<ElementRef<HTMLUListElement>>('list');

  constructor() {
    // Keep the active item scrolled into view inside the TOC's own scroll container,
    // so long TOCs don't lose track of where the user is.
    effect(() => {
      const id = this.active();
      if (!id || !isPlatformBrowser(this.platformId)) return;
      const ul = this.listEl()?.nativeElement;
      if (!ul) return;
      const el = ul.querySelector<HTMLAnchorElement>(`[data-section-id="${id}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }
}

// h2 rail at left:0 (border at margin-left:0). h3 at 12px. h4 at 24px.
// → rail visibly steps inward with depth.
function indentForLevel(level: 2 | 3 | 4): number {
  return (level - 2) * 12;
}
