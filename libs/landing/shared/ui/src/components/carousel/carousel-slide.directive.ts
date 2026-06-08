import { Directive, TemplateRef, inject, input } from '@angular/core';

/** Context passed to a `landingCarouselSlide` template. */
export interface CarouselSlideContext<T = unknown> {
  /** The current item from the carousel's `[items]` array. */
  readonly $implicit: T;
  /** Zero-based slide index. */
  readonly index: number;
}

/**
 * Marks an `<ng-template>` as the per-slide renderer for `landing-carousel`'s
 * **content mode** — i.e. the carousel projects arbitrary content (cards,
 * panels…) instead of its default `<landing-figure>` image slides.
 *
 * The carousel still owns the track / snap / count / index / dots / arrows; the
 * consumer only supplies what's inside each slide:
 *
 * ```html
 * <landing-carousel [items]="posts()" peek showDots>
 *   <ng-template landingCarouselSlide [landingCarouselSlideTypeOf]="posts()" let-post let-i="index">
 *     <article class="card">…</article>
 *   </ng-template>
 * </landing-carousel>
 * ```
 *
 * Bind the same array to `[landingCarouselSlideTypeOf]` as the carousel's
 * `[items]` to type the `let-` context (mirrors `ngFor`'s `ngForOf` anchor); it
 * is type-only — the carousel still drives rendering from its own `[items]`.
 */
@Directive({
  selector: '[landingCarouselSlide]',
  standalone: true,
})
export class CarouselSlide<T = unknown> {
  readonly template = inject<TemplateRef<CarouselSlideContext<T>>>(TemplateRef);

  /** Type anchor only — narrows `$implicit` to the item type. */
  readonly typeOf = input<readonly T[]>([], { alias: 'landingCarouselSlideTypeOf' });

  /** Type-narrowing guard for the `let-` context (Angular template checker). */
  static ngTemplateContextGuard<T>(_dir: CarouselSlide<T>, _ctx: unknown): _ctx is CarouselSlideContext<T> {
    return true;
  }
}
