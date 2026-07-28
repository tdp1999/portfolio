import { Pipe, PipeTransform } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '../services/copy/landing-copy.util';
import type { CopyValues, LandingCopyKey } from '../services/copy/landing-copy.types';

/**
 * Template read side of `LANDING_COPY`.
 *
 * ```html
 * <h2>{{ 'contact.form.srHeading' | landingCopy: locale() }}</h2>
 * ```
 *
 * **Why locale is a required argument.** A pure pipe only re-runs when one of
 * its inputs changes, and reading a signal inside `transform` would not
 * register as a change — so the language toggle would leave stale text on
 * screen. Passing `locale()` makes the signal an actual pipe input: pure, OnPush
 * safe, and no impure pipe running on every change-detection cycle.
 *
 * It also gets the legal pages right for free — `/privacy` and `/terms` drive
 * locale from `?lang=` rather than the site-wide toggle, so they pass their own
 * signal here exactly like `<landing-t [locale]>`.
 *
 * A key with `{slot}`s takes a third argument, typed from the entry itself:
 *
 * ```html
 * {{ 'blog.readTime' | landingCopy: locale() : { n: minutes() } }}
 * ```
 *
 * For HTML-rich copy (an `<em>` accent, an inline link, a list) keep using
 * `<landing-t>` — a string dictionary cannot carry markup.
 */
@Pipe({ name: 'landingCopy', standalone: true })
export class LandingCopyPipe implements PipeTransform {
  transform<K extends LandingCopyKey>(key: K, locale: Locale, values?: CopyValues<K>): string {
    return resolveCopy(key, locale, values);
  }
}
