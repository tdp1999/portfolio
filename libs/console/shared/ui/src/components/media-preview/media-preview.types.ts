/**
 * The three names a stored asset can carry, plus the url. Every console surface
 * that shows a picture has some subset of these; the preview resolves one label
 * from whatever it is given (see `resolveMediaLabel`).
 */
export interface MediaPreviewItem {
  /** Stable key for `@for` tracking and for the lightbox index. */
  readonly id: string;
  readonly url: string | null | undefined;
  /** What the author wrote ABOUT the picture. First choice for the label. */
  readonly caption?: string | null;
  /** The upload filename. Second choice — factual, always present for a real upload. */
  readonly filename?: string | null;
  /** Accessibility text. Last choice for the label, but always the `alt` attribute. */
  readonly altText?: string | null;
  readonly mimeType?: string | null;
}
