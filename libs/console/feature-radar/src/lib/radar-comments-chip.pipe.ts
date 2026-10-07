import { Pipe, PipeTransform } from '@angular/core';
import type { RadarCommentsChip, RadarCommentsSummary } from './radar.types';
import { toCommentsChip } from './radar-item.util';

@Pipe({ name: 'radarCommentsChip', standalone: true })
export class RadarCommentsChipPipe implements PipeTransform {
  transform(c: RadarCommentsSummary, wantsComments = false): RadarCommentsChip {
    return toCommentsChip(c, wantsComments);
  }
}
