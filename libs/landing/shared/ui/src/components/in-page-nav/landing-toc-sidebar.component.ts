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
            [class.toc__item--passed]="s.isPassed"
            [class.toc__item--last]="s.isLast"
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
      /* Left breathing room so the active + endpoint dots (at left: -4px on
         each rail) are not clipped by overflow:auto's implicit overflow-x. */
      padding-left: 8px;
      padding-right: 8px;
      padding-bottom: 8px;
      /* Hide scrollbar — long TOCs still scroll via wheel/touch, but the
         scrollbar chrome was visually noisy. */
      scrollbar-width: none;
    }
    :host::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    .toc__list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .toc__item {
      position: relative;
    }

    /* "Elbow" connector: 2px horizontal stroke at the TOP of each item that
       bridges the previous item's rail to this item's rail. Matches the rail
       width so the thread reads as one continuous wire across level changes. */
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
          2px
      );
      height: 2px;
      background-color: var(--landing-border);
      transition: background-color 240ms ease;
    }

    .toc__item:has(.toc__link--active)::before {
      background-color: var(--landing-accent);
    }

    /* Trail: items above the active item read as "already passed" — rail and
       elbow colored accent, text slightly brighter than untouched default. */
    .toc__item--passed::before {
      background-color: var(--landing-accent);
    }
    .toc__item--passed .toc__link {
      color: var(--landing-text-300);
      border-left-color: var(--landing-accent);
    }

    /* Each item carries its OWN vertical rail at --toc-indent. Combined with
       the elbow above, the rails read as one continuous thread that steps
       inward with depth. Active state only changes COLOR (not width) so the
       accent transitions smoothly without any layout jiggle. */
    .toc__link {
      display: block;
      position: relative;
      margin-left: var(--toc-indent, 0px);
      padding-block: 8px;
      padding-left: 16px;
      border-left: 2px solid var(--landing-border);
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

    /* Active item gets a filled dot pinned to the rail (centered on its left
       edge), plus the accent color shift. The dot is the unmistakable "you
       are here" marker — color-only highlights were too quiet in earlier
       feedback. */
    .toc__link--active {
      color: var(--landing-accent);
      border-left-color: var(--landing-accent);
      font-weight: 500;
    }
    .toc__link--active::before {
      content: '';
      position: absolute;
      left: -5px;
      top: 50%;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--landing-accent);
      transform: translateY(-50%);
      transition: background-color 240ms ease;
    }

    /* Endpoint cap: small dot pinned to the bottom of the last item, marking
       where the rail ends. Stays muted (border color) — terminal marker. */
    .toc__item--last .toc__link::after {
      content: '';
      position: absolute;
      left: -5px;
      bottom: -5px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--landing-border);
      transition: background-color 240ms ease;
    }
    .toc__item--last.toc__item--passed .toc__link::after,
    .toc__item--last:has(.toc__link--active) .toc__link::after {
      background-color: var(--landing-accent);
    }

    /* If the LAST item is the active one, suppress the middle "active dot" —
     * the endpoint dot already serves as the "you are here" marker, and
     * showing both reads as two separate indicators. */
    .toc__item--last .toc__link--active::before {
      display: none;
    }
  `,
})
export class LandingTocSidebarComponent {
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sections = input.required<readonly InPageSection[]>();
  readonly label = input('On this page');

  readonly active = computed(() => this.scrollspy.active());

  /** Precomputed item descriptors with resolved level + indent + prev-indent
   *  and `isPassed` / `isLast` flags for the trail + endpoint dot. */
  protected readonly items = computed(() => {
    const list = this.sections();
    const activeId = this.active();
    const activeIdx = activeId ? list.findIndex((s) => s.id === activeId) : -1;
    const lastIdx = list.length - 1;
    return list.map((s, i) => {
      const level = s.level ?? 2;
      const indent = indentForLevel(level);
      const prevLevel = list[i - 1]?.level ?? level;
      return {
        id: s.id,
        title: s.title,
        level,
        indent,
        prevIndent: indentForLevel(prevLevel),
        isPassed: activeIdx > 0 && i < activeIdx,
        isLast: i === lastIdx,
      };
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

// h2 rail at left:0 (border at margin-left:0). h3 at 16px. h4 at 32px.
// → rail visibly steps inward with depth.
function indentForLevel(level: 2 | 3 | 4): number {
  return (level - 2) * 16;
}
