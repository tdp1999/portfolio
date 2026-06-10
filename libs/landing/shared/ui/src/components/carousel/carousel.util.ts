/** Per-instance fallback group id (SSR-safe: deterministic instantiation order). */
let carouselSeq = 0;

export function nextCarouselGroupId(): string {
  return `lb-carousel-${carouselSeq++}`;
}
