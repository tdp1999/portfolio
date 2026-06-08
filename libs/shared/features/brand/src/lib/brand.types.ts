/**
 * Brand identity domain types (ubiquitous language).
 *
 * Brand = a named, configured identity instance (aggregate root). It owns a Theme
 * and is rendered as marks: the Monogram (`tdp.`, primary), the Wordmark
 * (`Phuong Tran`, secondary), and their Signature lockup.
 */

/** Render mode for any Brand mark. */
export type BrandVariant = 'full' | 'mono' | 'knockout';

/** Colour mode hint, for consumers pairing the mark with a surface. */
export type BrandMode = 'light' | 'dark';

/** Configurable theme for a Brand instance. */
export interface BrandTheme {
  /** Accent colour for the Dot (the brand atom). */
  accent: string;
  /** Optional surface/background colour (consumer-applied). */
  surface?: string;
  /** Light/dark hint. */
  mode?: BrandMode;
}

/** A named, configured identity instance — the Brand aggregate root. */
export interface BrandConfig {
  /** Machine name, e.g. `tdp`. */
  name: string;
  /** Primary Monogram text, e.g. `tdp.` */
  monogram: string;
  /** Secondary Wordmark text, e.g. `Phuong Tran`. */
  wordmark: string;
  theme: BrandTheme;
}
