export interface MoreItem {
  readonly label: string;
  readonly description: string;
  readonly hint?: string;
  readonly iconName: string;
  readonly meta?: string;
  readonly featured?: boolean;
  /** Optional pill shown next to the title in the badge-forward shapes (V9b). */
  readonly badge?: string;
}

/**
 * A titled group of items — the V7 "sectioned" family. V1–V6 explored the flat
 * "More" dropdown; V7 grows it into named sections once the site has a real
 * Product (Document Engine) and downloadable Documents (CV) worth their own group.
 */
export interface MoreSection {
  readonly title: string;
  readonly items: readonly MoreItem[];
}

/**
 * Every hand-rolled working-disclosure demo on the page is keyed so one shared
 * signal can track which is open (opening one closes the rest). V8 renders the
 * type-led shapes (a/b/c); V9 renders the icon-forward alternatives (a, c). V9b is
 * NOT here — it shipped, so its showcase renders the real `landing-mega-menu`
 * component, which owns its own open state. The interaction + a11y contract is
 * identical across all of them; only the panel shape differs.
 */
export type MenuKey = 'v8a' | 'v8b' | 'v8c' | 'v9a' | 'v9c';
