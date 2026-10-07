import { Pipe, PipeTransform } from '@angular/core';
import type { RadarSourceMonogram } from './radar.types';
import { toSourceMonogram } from './radar-item.util';

@Pipe({ name: 'radarSourceMonogram', standalone: true })
export class RadarSourceMonogramPipe implements PipeTransform {
  transform(displayName: string): RadarSourceMonogram {
    return toSourceMonogram(displayName);
  }
}
