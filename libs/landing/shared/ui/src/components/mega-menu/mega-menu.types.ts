export interface MegaMenuItem {
  /** Display label (title row). */
  readonly label: string;
  /** Long description — shown on a product's rail card (and the CTA-bearing hero when it is the sole product). */
  readonly description?: string;
  /** Short mono-styled tag rendered on the right of compact rows (e.g. "tools", "PDF / 120kb"). */
  readonly hint?: string;
  /**
   * Marks this item as a Product — it renders in the featured "Products" column
   * (first column) rather than a compact section column. The column adapts to how
   * many there are:
   * - exactly one → a featured card (preview tile + title + description + CTA);
   * - two or more → a stacked "Products" list of compact product cards.
   */
  readonly product?: boolean;
  /**
   * The titled column this item belongs to, by visible title (e.g. "Explore",
   * "Documents"). Ignored for products. Items sharing a `section` group together
   * in first-seen order; items with no `section` fall into one untitled column.
   */
  readonly section?: string;
  /** Optional freshness pill shown next to the label (e.g. "New", "Sandbox"). */
  readonly badge?: string;
  /** Call-to-action label for a sole product's featured card (e.g. "Explore"). Falls back to "Explore". */
  readonly cta?: string;
  /** Target href. Use a `/path` for internal routes, full URL for external, `mailto:` / `tel:` / `#anchor`. */
  readonly href: string;
  /**
   * Explicit kind. Defaults are inferred:
   * - `/...` → `internal` (uses `routerLink`)
   * - `http(s)://` → `external` (opens in new tab)
   * - other → resolved-as-is via `href`.
   *
   * Set `download` to force the native `download` attribute (resume PDF).
   */
  readonly kind?: 'internal' | 'external' | 'download' | 'anchor';
  /** Optional lucide icon name. Used by the product cards in the rail. */
  readonly iconName?: string;
  /**
   * Optional preview screenshot for a product's featured tile (light theme). When
   * set, the sole product's banner shows this image and thins to a mist over the
   * icon tile on hover. Pair with {@link imageDark} for a theme-matched shot.
   */
  readonly image?: string;
  /** Dark-theme counterpart of {@link image}; shown when `<html>` carries `.dark`. */
  readonly imageDark?: string;
  /** Optional fragment (anchor inside the target path). Only applies to internal links. */
  readonly fragment?: string;
}

/** A titled column of compact items, grouped from {@link MegaMenuItem.section}. */
export interface MegaMenuSection {
  readonly title: string | null;
  readonly items: readonly MegaMenuItem[];
}

/** `screen` centres the panel on the viewport; the rest anchor it to the trigger. */
export type MegaMenuAlign = 'left' | 'center' | 'right' | 'screen';
export type MegaMenuColumns = 1 | 2;
