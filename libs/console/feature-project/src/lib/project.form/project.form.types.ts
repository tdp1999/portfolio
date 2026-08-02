export interface GalleryImage {
  mediaId: string;
  url: string;
  /** Original upload filename — what the row is labelled with. Comes from the admin
   *  read payload on load, and straight off the picker result on a fresh pick. */
  filename: string | null;
  altText: string | null;
}
