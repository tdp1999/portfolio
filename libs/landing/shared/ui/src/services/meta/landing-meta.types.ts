/** What a page declares about itself for the document head. */
export interface LandingPageMeta {
  /** `<title>`, `og:title`, `twitter:title` — one string, three places. */
  readonly title: string;
  /** Falls back to the site description for the active locale. */
  readonly description?: string;
  /**
   * Canonical path with leading slash, e.g. `/projects/foo`. Defaults to the
   * current router URL with query and fragment stripped — pass it explicitly
   * only when a query string is part of the canonical identity, which on this
   * site means `?lang=vi` on the legal pages.
   */
  readonly path?: string;
  /** Absolute URL. Falls back to the site share image. */
  readonly image?: string;
  readonly imageAlt?: string;
  readonly type?: 'website' | 'profile' | 'article';
  /** Emits `<meta name="robots" content="noindex">`. */
  readonly noindex?: boolean;
  /**
   * Extra `property`-keyed tags a page type needs (`article:published_time`,
   * `article:author`). Cleared on the next `apply`, so an article's tags do not
   * follow the visitor onto the next page.
   */
  readonly extra?: Readonly<Record<string, string>>;
}
