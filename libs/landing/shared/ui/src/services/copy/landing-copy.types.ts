import type { LANDING_COPY } from './landing-copy.data';

/**
 * One bilingual entry. Both sides are required so a half-translated string is a
 * compile error rather than something that silently ships in the wrong language.
 * A genuinely untranslatable value (a proper noun, a unit) repeats itself.
 */
export interface LandingCopyEntry {
  readonly en: string;
  readonly vi: string;
}

/** Every key the dictionary knows. Typos are compile errors. */
export type LandingCopyKey = keyof typeof LANDING_COPY;

/** Shape of the dictionary — used by the resolver so tests can inject a stub. */
export type LandingCopyDict = Readonly<Record<string, LandingCopyEntry>>;

/**
 * The interpolation slots in a copy string, as a union of their names.
 *
 * `{n}` in `Slide {n} of {total}` is a slot. `{{customer_name}}` is **not** —
 * `/document-engine` explains its own template syntax in prose, and that syntax
 * happens to be braces. The exclusions below are what keeps those two entries
 * from demanding a `customer_name` parameter: a captured name holding a brace or
 * a space is literal text, not a slot.
 *
 * Recursion terminates on `Rest`, so a string with three slots yields all three.
 */
export type CopySlots<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ?
      | (Name extends `${string}{${string}` | `${string}}${string}` | `${string} ${string}` ? never : Name)
      | CopySlots<Rest>
  : never;

/**
 * The slots of one entry, read from the `en` side.
 *
 * One side is enough because `landing-copy.spec.ts` asserts both locales carry
 * the same slot set — that spec is what makes this shortcut safe.
 */
export type CopySlotsOf<K extends LandingCopyKey> = CopySlots<(typeof LANDING_COPY)[K]['en']>;

/**
 * The values a call site must supply for a key.
 *
 * Interpolation used to be `.replace('{n}', …)` at the call site, where every
 * mistake shipped a raw brace to the screen. Two things make that a compile
 * error instead:
 *
 * - `Record`, not `Partial<Record>` — filling `{n}` and forgetting `{total}`
 *   does not typecheck, and a misspelled name is an excess property;
 * - `never` for a slotless key — passing values to a string with no slots is
 *   rejected outright. `Record<never, …>` would not do it: that resolves to `{}`,
 *   which structurally accepts any object.
 *
 * A dynamic key (`config.titleKey`) widens to the whole union, whose slot set is
 * non-empty, so those call sites keep the `values` argument optional.
 */
export type CopyValues<K extends LandingCopyKey> = [CopySlotsOf<K>] extends [never]
  ? never
  : Record<CopySlotsOf<K>, string | number>;
