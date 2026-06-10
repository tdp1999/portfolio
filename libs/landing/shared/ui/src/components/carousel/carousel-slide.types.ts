/** Context passed to a `landingCarouselSlide` template. */
export interface CarouselSlideContext<T = unknown> {
  /** The current item from the carousel's `[items]` array. */
  readonly $implicit: T;
  /** Zero-based slide index. */
  readonly index: number;
}
