import { Injectable, Signal, computed, inject } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import { LandingLocaleService } from '../locale';
import { resolveCopy } from './landing-copy.util';
import type { CopyValues, LandingCopyKey } from './landing-copy.types';

/**
 * Reactive read side of {@link LANDING_COPY} for TypeScript.
 *
 * Templates should prefer the `landingCopy` pipe; this service is for strings
 * that have to reach an attribute or an interface (`aria-label`, a
 * `BreadcrumbItem[]`, a `SegmentOption.label`), where content projection and
 * pipes cannot go.
 *
 * ```ts
 * private readonly copy = inject(LandingCopyService);
 * protected readonly submitLabel = this.copy.t('contact.form.submit.idle');
 * ```
 *
 * The returned signal tracks {@link LandingLocaleService.locale}, so switching
 * language re-renders without any manual subscription.
 */
@Injectable({ providedIn: 'root' })
export class LandingCopyService {
  private readonly globalLocale = inject(LandingLocaleService).locale;

  /**
   * `t()` **creates** a computed, so it belongs in a field initializer and
   * nowhere else. Calling it inside another computed allocates a fresh reactive
   * node on every recomputation and discards it; call `resolveCopy` there
   * instead, which is the whole of the work anyway.
   *
   * @param key    entry in the dictionary — typos are compile errors.
   * @param locale optional override for a component that receives locale as an
   *               `input()` rather than from the site-wide toggle.
   * @param values `{slot}` fills, typed from the entry. Static only — a value
   *               that changes over time belongs in the caller's own `computed`.
   */
  t<K extends LandingCopyKey>(key: K, locale?: Signal<Locale>, values?: CopyValues<K>): Signal<string> {
    return computed(() => resolveCopy(key, (locale ?? this.globalLocale)(), values));
  }
}
