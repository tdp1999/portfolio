import { Directive, input } from '@angular/core';

type UmamiTracker = { track: (event: string, data?: Record<string, unknown>) => void };

/**
 * Fires a Umami custom event on click, WITHOUT using the native `data-umami-event`
 * attribute.
 *
 * **Why not `data-umami-event`:** Umami's built-in click handler hijacks clicks on
 * internal `<a>` elements that carry that attribute — it calls `preventDefault()`,
 * flushes the tracking beacon, then navigates with `location.href = href`. On an
 * Angular SPA that turns a client-side `routerLink` navigation into a full page
 * reload, so every internal link "loads twice" (SPA nav + forced full reload).
 * See task-326.
 *
 * Tracking programmatically sidesteps this entirely: the router owns navigation,
 * the directive only emits the event. Behaves the same on buttons and external
 * (`target="_blank"`) links. Pageview auto-tracking (via Umami's `history` patch)
 * is unaffected — it still fires exactly once per navigation.
 *
 * **Usage:**
 * ```html
 * <a [routerLink]="item.path" umamiEvent="nav-primary" [umamiData]="{ to: item.label }">…</a>
 * <button umamiEvent="palette-open">…</button>
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[umamiEvent]',
  standalone: true,
  host: {
    '(click)': 'track()',
  },
})
export class UmamiEventDirective {
  /** Umami custom event name. */
  readonly umamiEvent = input.required<string>();
  /** Optional event properties (formerly the `data-umami-event-*` attributes). */
  readonly umamiData = input<Record<string, string | number | boolean | undefined>>();

  protected track(): void {
    // SSR-safe, and a no-op until the async Umami script loads (matches the prior
    // declarative behavior — dropped events were already possible pre-load).
    const umami = (globalThis as { umami?: UmamiTracker }).umami;
    umami?.track(this.umamiEvent(), this.umamiData());
  }
}
