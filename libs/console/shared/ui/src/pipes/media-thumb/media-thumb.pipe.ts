import { Pipe, PipeTransform, inject } from '@angular/core';
import { CLOUDINARY_UPLOAD_SEGMENT } from '@portfolio/shared/ui';
import { mediaThumbTransform } from '../../components/media-preview/media-preview.util';

/**
 * `url | mediaThumb: <rendered CSS width>` — the sized-image rule from
 * {@link MediaPreview}, for the slots that cannot use the whole component because
 * they carry their own chrome (overlay Replace/Remove buttons, drag-handle rows,
 * list cells).
 *
 * Takes the CSS width the image is actually rendered at, not the width to fetch:
 * doubling for retina and rounding to a shared step is the pipe's job, so a caller
 * only ever has to state a fact it can read off its own stylesheet.
 *
 * Non-Cloudinary urls (the local storage adapter, seeded picsum links) pass through
 * untouched — there is no transform engine behind them.
 */
@Pipe({ name: 'mediaThumb', standalone: true })
export class MediaThumbPipe implements PipeTransform {
  private readonly uploadSegment = inject(CLOUDINARY_UPLOAD_SEGMENT);

  transform(url: string | null | undefined, cssWidth: number): string {
    if (!url) return '';
    const idx = url.indexOf(this.uploadSegment);
    if (idx < 0) return url;
    const head = url.slice(0, idx + this.uploadSegment.length);
    const tail = url.slice(idx + this.uploadSegment.length);
    return `${head}${mediaThumbTransform(cssWidth)}/${tail}`;
  }
}
