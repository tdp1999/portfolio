export interface MoreItem {
  readonly label: string;
  readonly description: string;
  readonly hint?: string;
  readonly iconName: string;
  readonly meta?: string;
  readonly featured?: boolean;
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
