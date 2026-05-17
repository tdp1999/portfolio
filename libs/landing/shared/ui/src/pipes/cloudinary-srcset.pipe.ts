import { Pipe, PipeTransform } from '@angular/core';
import { buildCloudinarySrcset, type CloudinarySrcset } from '@portfolio/landing/shared/util';

/**
 * Compute a 1×/2× Cloudinary `srcset` from a delivery URL.
 *
 * Usage:
 * ```html
 * @let set = img.url | cloudinarySrcset: 720;
 * <img [src]="set.src" [attr.srcset]="set.srcset || null" loading="lazy" />
 * ```
 */
@Pipe({ name: 'cloudinarySrcset', standalone: true })
export class CloudinarySrcsetPipe implements PipeTransform {
  transform(url: string | null | undefined, width: number): CloudinarySrcset {
    return buildCloudinarySrcset(url, width);
  }
}
