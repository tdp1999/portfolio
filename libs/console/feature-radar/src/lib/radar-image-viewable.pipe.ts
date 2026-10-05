import { Pipe, PipeTransform } from '@angular/core';
import { isViewableImage } from './radar-item.util';
import type { RadarItemImage } from './radar.types';

/** Pure: re-runs when `broken` changes, and the Detail page replaces that set on every failed load. */
@Pipe({ name: 'radarImageViewable', standalone: true })
export class RadarImageViewablePipe implements PipeTransform {
  transform(img: RadarItemImage, broken: ReadonlySet<string>): boolean {
    return isViewableImage(img, broken);
  }
}
