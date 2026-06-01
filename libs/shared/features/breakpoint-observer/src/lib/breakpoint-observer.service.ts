import { BreakpointObserver } from '@angular/cdk/layout';
import { computed, DestroyRef, inject, Injectable, Injector, runInInjectionContext, Signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReplaySubject } from 'rxjs';

import { DEFAULT_BREAKPOINTS } from './breakpoint.constant';
import { BreakpointConfig, BreakpointState } from './breakpoint.type';
import { Bp, BP_ORDER, RESPONSIVE_BREAKPOINTS, SSR_FALLBACK_BP } from './responsive-breakpoint.constant';

const INACTIVE_STATE: BreakpointState = {
  name: '',
  mediaQuery: '',
  isActive: false,
};

@Injectable({
  providedIn: 'root',
})
export class BreakpointObserverService {
  private readonly cdkBreakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly cache = new Map<string, Signal<BreakpointState>>();

  // ---------------------------------------------------------------------------
  // 4-BP responsive API (responsive-system skill). Built additively on top of
  // the generic `observe()` below — see responsive-contract.md §5. SSR-safe:
  // `currentBp` defaults to the widest BP until the browser observer emits.
  // ---------------------------------------------------------------------------

  // Established eagerly (constructor, non-reactive) — `toSignal` inside `observe`
  // cannot run from within a reactive context (NG0602). `observe` caches it.
  private readonly responsiveState = this.observe(RESPONSIVE_BREAKPOINTS);

  /** The current device-bound breakpoint. `'wide'` during SSR / before first emit. */
  readonly currentBp: Signal<Bp> = computed(() => {
    const name = this.responsiveState().name;
    return this.isBp(name) ? name : SSR_FALLBACK_BP;
  });

  readonly isMobile: Signal<boolean> = computed(() => this.currentBp() === 'mobile');
  readonly isTablet: Signal<boolean> = computed(() => this.currentBp() === 'tablet');
  readonly isLaptop: Signal<boolean> = computed(() => this.currentBp() === 'laptop');
  readonly isWide: Signal<boolean> = computed(() => this.currentBp() === 'wide');

  /** True for the named BP and every wider one. */
  isAtLeast(bp: Bp): boolean {
    return BP_ORDER[this.currentBp()] >= BP_ORDER[bp];
  }

  private isBp(name: string): name is Bp {
    return name in BP_ORDER;
  }

  observe(breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS): Signal<BreakpointState> {
    const key = JSON.stringify(breakpoints);

    const cached = this.cache.get(key);
    if (cached) return cached;

    const subject = new ReplaySubject<BreakpointState>(1);
    this.setupObserver(breakpoints, subject);

    const signal = runInInjectionContext(this.injector, () => toSignal(subject, { initialValue: INACTIVE_STATE }));
    this.cache.set(key, signal);

    return signal;
  }

  private setupObserver(breakpoints: BreakpointConfig, subject: ReplaySubject<BreakpointState>): void {
    const mediaQueries = Object.values(breakpoints);

    this.cdkBreakpointObserver
      .observe(mediaQueries)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        for (const [name, mediaQuery] of Object.entries(breakpoints)) {
          if (result.breakpoints[mediaQuery]) {
            subject.next({ name, mediaQuery, isActive: true });
            return;
          }
        }

        const first = Object.entries(breakpoints)[0];
        subject.next(first ? { name: first[0], mediaQuery: first[1], isActive: false } : INACTIVE_STATE);
      });
  }
}
