import type { Locale } from '@portfolio/shared/types';
import { LANDING_COPY } from './landing-copy.data';
import type { CopyValues, LandingCopyDict, LandingCopyKey } from './landing-copy.types';

/**
 * A single-brace `{name}` slot, or a double-brace `{{name}}` that is not one.
 *
 * Both alternatives are matched so the double-brace case is *consumed* rather
 * than left for the single-brace branch to chew on: `/document-engine` describes
 * its own `{{customer_name}}` template syntax in prose, and without the first
 * alternative that inner `{customer_name}` would look like a slot.
 */
const SLOT_OR_LITERAL = /\{\{(\w+)\}\}|\{(\w+)\}/g;

/**
 * Look a key up in a dictionary, with the fallback chain but no interpolation.
 *
 * Separate from {@link resolveCopy} so the fallback tests can pass a stub
 * dictionary without planting fixtures in the real one, and so the public
 * signature keeps its third slot for the thing call sites actually need.
 *
 * Fallback chain: requested locale → `en` → `vi` → the key itself. Returning the
 * key (rather than an empty string) keeps a missing entry visible in the UI
 * instead of silently collapsing whatever laid out around it.
 */
export function resolveFrom(dict: LandingCopyDict, key: string, locale: Locale): string {
  const entry = dict[key];
  if (!entry) return key;
  return entry[locale] || entry.en || entry.vi || key;
}

/**
 * Resolve a copy key to a string, filling its `{slot}`s from `values`.
 *
 * ```ts
 * resolveCopy('a11y.slide.position', locale, { n: index + 1, total: count });
 * ```
 *
 * `values` is typed from the entry itself ({@link CopyValues}), so a missing slot
 * and a misspelled one are both compile errors rather than a stray `{n}` on
 * screen. It stays optional because a key may be dynamic (`config.titleKey`), and
 * `landing-copy-contract.spec.ts` covers the other half: a key that *has* slots
 * may not be read without them.
 *
 * Pure by design — the reactive wrapper is {@link LandingCopyService.t}.
 */
export function resolveCopy<K extends LandingCopyKey>(key: K, locale: Locale, values?: CopyValues<K>): string {
  const raw = resolveFrom(LANDING_COPY, key, locale);
  return values ? fillSlots(raw, values) : raw;
}

function fillSlots(template: string, values: Record<string, string | number>): string {
  return template.replace(SLOT_OR_LITERAL, (match, doubled: string | undefined, single: string) => {
    if (doubled !== undefined) return match;
    const value = values[single];
    // An unfilled slot stays visible, for the same reason a missing key returns
    // the key: silence is the failure mode that reaches production.
    return value === undefined ? match : String(value);
  });
}
