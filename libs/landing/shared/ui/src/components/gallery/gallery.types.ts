/**
 * Image entry consumed by `<landing-gallery>`. Compatible with `ProjectImage`
 * but kept independent so the gallery can be reused outside the project module.
 */
export type GalleryImage = {
  readonly url: string;
  readonly alt?: string | null;
  readonly caption?: string | null;
  /** Explicit full-resolution source for the lightbox (overrides `url`). */
  readonly fullSrc?: string | null;
  /** Explicit responsive `srcset` for the lightbox. */
  readonly srcset?: string | null;
  /** Download / open-original URL for the lightbox. */
  readonly downloadUrl?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
};
