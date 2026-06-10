import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';
import type { LandingTooltipAlign, LandingTooltipPosition } from './tooltip.types';

export type { LandingTooltipAlign, LandingTooltipPosition } from './tooltip.types';

/**
 * Tooltip / popover wrapper. CSS-only — visibility flips on `:hover` and `:focus-within`, so this
 * is SSR-safe (no DOM mutation, no scripting) and zero-cost when the user doesn't interact.
 *
 * Wraps a trigger element (button, link, icon, anything) and projects it via `<ng-content>`. The
 * bubble + arrow render as a sibling absolute-positioned span. Parent must NOT clip overflow.
 *
 * ```html
 * <landing-tooltip text="Switch to grid view" position="bottom">
 *   <button>...</button>
 * </landing-tooltip>
 * ```
 *
 * `position="top|bottom"` controls which side the bubble appears. `align="start|center|end"`
 * shifts the bubble horizontally — useful when the trigger sits near a viewport edge.
 *
 * The bubble has a 200ms show-delay (prevents flicker on quick mouse-overs across siblings) and
 * an immediate hide. Width caps at ~28ch for legibility — wrap longer text manually if needed.
 */
@Component({
  selector: 'landing-tooltip',
  standalone: true,
  template: `
    <span [class]="wrapClass()">
      <ng-content />
      @if (text()) {
        <span class="lt__bubble" role="tooltip">
          <span class="lt__text">{{ text() }}</span>
          <span class="lt__arrow" aria-hidden="true"></span>
        </span>
      }
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .lt {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      .lt__bubble {
        position: absolute;
        z-index: 50;
        width: max-content;
        max-width: 32ch;
        padding: 8px 12px;
        font-family: var(--landing-font-body);
        font-size: var(--landing-body-sm);
        line-height: 1.45;
        color: var(--landing-text-300);
        background: var(--landing-ink-0);
        border: 1px solid var(--landing-border);
        border-radius: 4px;
        box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.6);
        white-space: normal;
        text-align: left;
        pointer-events: none;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-2px);
        /* hide: instant. show: delayed via :hover rule. */
        transition:
          opacity 160ms ease,
          transform 160ms ease,
          visibility 0s linear 160ms;
      }
      .lt:hover > .lt__bubble,
      .lt:focus-within > .lt__bubble {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        transition:
          opacity 160ms ease 200ms,
          transform 160ms ease 200ms,
          visibility 0s linear 200ms;
      }
      .lt__text {
        display: block;
      }

      /* ─── Position: bottom (default) ─── */
      .lt--bottom > .lt__bubble {
        top: calc(100% + 16px);
        left: 50%;
        transform: translate(-50%, -2px);
      }
      .lt--bottom:hover > .lt__bubble,
      .lt--bottom:focus-within > .lt__bubble {
        transform: translate(-50%, 0);
      }
      .lt--bottom .lt__arrow {
        top: -5px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        border-left: 1px solid var(--landing-border);
        border-top: 1px solid var(--landing-border);
        border-right: none;
        border-bottom: none;
      }

      /* ─── Position: top ─── */
      .lt--top > .lt__bubble {
        bottom: calc(100% + 16px);
        left: 50%;
        transform: translate(-50%, 2px);
      }
      .lt--top:hover > .lt__bubble,
      .lt--top:focus-within > .lt__bubble {
        transform: translate(-50%, 0);
      }
      .lt--top .lt__arrow {
        bottom: -5px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        border-right: 1px solid var(--landing-border);
        border-bottom: 1px solid var(--landing-border);
        border-left: none;
        border-top: none;
      }

      /* ─── Align: start / center / end (shifts bubble horizontally) ─── */
      .lt--start > .lt__bubble {
        left: 0;
        transform: translateY(-2px);
      }
      .lt--start.lt--bottom:hover > .lt__bubble,
      .lt--start.lt--bottom:focus-within > .lt__bubble,
      .lt--start.lt--top:hover > .lt__bubble,
      .lt--start.lt--top:focus-within > .lt__bubble {
        transform: translateY(0);
      }
      .lt--start .lt__arrow {
        left: 14px;
        transform: rotate(45deg);
      }

      .lt--end > .lt__bubble {
        right: 0;
        left: auto;
        transform: translateY(-2px);
      }
      .lt--end.lt--bottom:hover > .lt__bubble,
      .lt--end.lt--bottom:focus-within > .lt__bubble,
      .lt--end.lt--top:hover > .lt__bubble,
      .lt--end.lt--top:focus-within > .lt__bubble {
        transform: translateY(0);
      }
      .lt--end .lt__arrow {
        right: 14px;
        left: auto;
        transform: rotate(45deg);
      }

      .lt__arrow {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--landing-ink-0);
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {
  readonly text = input.required<string>();
  readonly position = input<LandingTooltipPosition>('bottom');
  readonly align = input<LandingTooltipAlign>('center');

  protected readonly wrapClass = computed(() => `lt lt--${this.position()} lt--${this.align()}`);
}
