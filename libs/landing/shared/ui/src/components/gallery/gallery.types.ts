/**
 * Image entry consumed by `<landing-gallery>`. Compatible with `ProjectImage`
 * but kept independent so the gallery can be reused outside the project module.
 */
export type GalleryImage = {
  readonly url: string;
  readonly alt?: string | null;
  readonly caption?: string | null;
};
