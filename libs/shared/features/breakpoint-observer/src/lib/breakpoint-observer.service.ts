import { BreakpointObserver } from '@angular/cdk/layout';
import {
  DestroyRef,
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
  Signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReplaySubject } from 'rxjs';

import { DEFAULT_BREAKPOINTS } from './breakpoint.constant';
import { BreakpointConfig, BreakpointState } from './breakpoint.type';

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

  observe(breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS): Signal<BreakpointState> {
    const key = JSON.stringify(breakpoints);

    const cached = this.cache.get(key);
    if (cached) return cached;

    const subject = new ReplaySubject<BreakpointState>(1);
    this.setupObserver(breakpoints, subject);

    const signal = runInInjectionContext(this.injector, () =>
      toSignal(subject, { initialValue: INACTIVE_STATE })
    );
    this.cache.set(key, signal);

    return signal;
  }

  private setupObserver(
    breakpoints: BreakpointConfig,
    subject: ReplaySubject<BreakpointState>
  ): void {
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
        subject.next(
          first ? { name: first[0], mediaQuery: first[1], isActive: false } : INACTIVE_STATE
        );
      });
  }
}
