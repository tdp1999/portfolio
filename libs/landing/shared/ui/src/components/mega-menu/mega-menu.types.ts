export interface MegaMenuItem {
  /** Display label (title row). */
  readonly label: string;
  /** Long description shown on the featured hero card. Ignored for compact rows when `hint` is present. */
  readonly description?: string;
  /** Short mono-styled tag rendered on the right of compact rows (e.g. "tools", "PDF / 120kb"). */
  readonly hint?: string;
  /** When true, this item is rendered as a hero card at the top of the panel. Only one featured item is supported per menu. */
  readonly featured?: boolean;
  /** Call-to-action label for the featured card (e.g. "Download"). Falls back to an arrow-only affordance. */
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
  /** Optional lucide icon name. Used by the featured card's icon frame. */
  readonly iconName?: string;
  /** Optional fragment (anchor inside the target path). Only applies to internal links. */
  readonly fragment?: string;
}

export type MegaMenuAlign = 'left' | 'center' | 'right';
export type MegaMenuColumns = 1 | 2;
