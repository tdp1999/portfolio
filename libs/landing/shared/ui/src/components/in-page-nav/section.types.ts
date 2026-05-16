/** A single navigable section within a page (used by all in-page nav components). */
export interface InPageSection {
  readonly id: string;
  readonly title: string;
  /** Heading depth (h2..h4). Drives indentation in TOC sidebar.
   * Omit for flat lists; defaults to `2` (top-level section). */
  readonly level?: 2 | 3 | 4;
}
