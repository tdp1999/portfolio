/**
 * A single image shown inside the lightbox. Built by the `[lightbox]` directive
 * from a host `<landing-figure>` (or explicit inputs) at open time.
 *
 * `url` is the inline/thumbnail source; the overlay resolves the **largest
 * available candidate** for display (see `LightboxOverlayComponent.resolveBest`):
 * `fullSrc` wins, else a Cloudinary URL is upscaled, else `url` is used as-is.
 */
export interface LightboxItem {
  /** Inline source (same as the thumbnail). Always present. */
  readonly url: string;
  /** Explicit full-resolution source. Overrides the inline `url` in the overlay. */
  readonly fullSrc?: string;
  /** Explicit responsive `srcset` for the overlay (e.g. Cloudinary transforms). */
  readonly srcset?: string;
  readonly alt?: string;
  readonly caption?: string;
  /** FIG. number echoed from the figure, if any. */
  readonly figureNumber?: number | null;
  /** Download / open-original URL. Falls back to the resolved full source. */
  readonly downloadUrl?: string;
  /** Show the download action in the toolbar. Hidden by default. */
  readonly showDownload?: boolean;
  readonly width?: number;
  readonly height?: number;
}

/**
 * A registered lightbox trigger. The directive registers one per opt-in figure;
 * the service orders them by DOM position to build the group's image list.
 */
export interface LightboxEntry {
  /** Group key — all entries sharing a key navigate together. */
  readonly group: string;
  /** The trigger host element (used for DOM-order sorting + FLIP rect). */
  readonly element: HTMLElement;
  /** Lazily build the item data (reads figure inputs at open time). */
  readonly item: () => LightboxItem;
  /** Current on-screen rect of the trigger image, for the FLIP animation. */
  readonly getRect: () => DOMRect | null;
}
