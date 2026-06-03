import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { ScrollEdgeFadeDirective } from '../../directives/scroll-edge-fade';

/** Keep the active tab this many px clear of the scrim chevrons when scrolled into view. */
const SCRIM_CLEARANCE = 56;

export interface SegmentOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type LandingSegmentedVariant = 'apple' | 'hairline' | 'underline';

@Component({
  selector: 'landing-segmented',
  standalone: true,
  imports: [ScrollEdgeFadeDirective],
  template: `
    <!-- Chevron affordances — only visible while the strip overflows in that direction
         (rail.atStart()/atEnd() from landingScrollEdgeFade). aria-hidden: redundant for
         keyboard users, who move between tabs with the arrow keys (which scrolls them
         into view); this is a pointer affordance. -->
    <button
      type="button"
      class="landing-segmented__chev landing-segmented__chev--prev"
      [hidden]="rail.atStart()"
      (click)="rail.scrollStep(-1)"
      tabindex="-1"
      aria-label="Scroll tabs left"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      [class]="rootClasses()"
      role="tablist"
      [attr.aria-label]="ariaLabel() || null"
      landingScrollEdgeFade
      [edgeFadeMask]="false"
      #rail="scrollEdgeFade"
    >
      @for (seg of segments(); track seg.id) {
        <button
          type="button"
          role="tab"
          [class]="segmentClass(seg)"
          [attr.id]="tabId(seg.id)"
          [attr.aria-selected]="seg.id === active()"
          [attr.aria-controls]="panelId(seg.id)"
          [attr.tabindex]="seg.id === active() ? 0 : -1"
          [disabled]="seg.disabled === true"
          (click)="select(seg)"
          (keydown)="onKey($event)"
        >
          {{ seg.label }}
        </button>
      }
    </div>

    <button
      type="button"
      class="landing-segmented__chev landing-segmented__chev--next"
      [hidden]="rail.atEnd()"
      (click)="rail.scrollStep(1)"
      tabindex="-1"
      aria-label="Scroll tabs right"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  `,
  styleUrl: './segmented.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedComponent {
  readonly segments = input.required<readonly SegmentOption[]>();
  readonly active = model<string>('');
  readonly variant = input<LandingSegmentedVariant>('apple');
  readonly ariaLabel = input<string>('');
  readonly idPrefix = input<string>('seg');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly edgeFade = viewChild(ScrollEdgeFadeDirective);

  protected readonly rootClasses = computed(() => `landing-segmented landing-segmented--${this.variant()}`);

  constructor() {
    // Whenever the active tab changes (click or keyboard), scroll it fully into view —
    // clearing the scrim chevrons — so the active label is never cut off under an edge.
    // rAF defers past the layout pass; guarded so it is a no-op during SSR.
    effect(() => {
      const id = this.active();
      if (typeof requestAnimationFrame === 'undefined') return;
      requestAnimationFrame(() => {
        const dir = this.edgeFade();
        const btn = this.host.nativeElement.querySelector<HTMLElement>(`#${CSS.escape(this.tabId(id))}`);
        if (dir && btn) dir.scrollIntoView(btn, SCRIM_CLEARANCE);
      });
    });
  }

  protected segmentClass(seg: SegmentOption): string {
    return `landing-segmented__btn${seg.id === this.active() ? ' is-active' : ''}`;
  }

  protected tabId(id: string): string {
    return `${this.idPrefix()}-tab-${id}`;
  }

  protected panelId(id: string): string {
    return `${this.idPrefix()}-panel-${id}`;
  }

  protected select(seg: SegmentOption): void {
    const current = this.segments().find((s) => s.id === seg.id);
    if (current?.disabled) return;
    this.active.set(seg.id);
  }

  protected onKey(event: KeyboardEvent): void {
    const enabled = this.segments().filter((s) => !s.disabled);
    if (enabled.length === 0) return;
    const currentIdx = Math.max(
      0,
      enabled.findIndex((s) => s.id === this.active())
    );

    let nextIdx = currentIdx;
    switch (event.key) {
      case 'ArrowRight':
        nextIdx = (currentIdx + 1) % enabled.length;
        break;
      case 'ArrowLeft':
        nextIdx = (currentIdx - 1 + enabled.length) % enabled.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = enabled.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.active.set(enabled[nextIdx].id);
    const tablist = (event.currentTarget as HTMLElement).parentElement;
    const next = tablist?.querySelector<HTMLButtonElement>(`#${this.tabId(enabled[nextIdx].id)}`);
    next?.focus();
  }
}
