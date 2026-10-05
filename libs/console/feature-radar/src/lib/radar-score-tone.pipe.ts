import { Pipe, PipeTransform } from '@angular/core';

/** Signal score to its tone class: 7+ worth reading, 4 to 6 maybe, below 4 skip. */
@Pipe({ name: 'radarScoreTone', standalone: true })
export class RadarScoreTonePipe implements PipeTransform {
  transform(score: number): string {
    if (score >= 7) return 'radar-score--high';
    if (score >= 4) return 'radar-score--mid';
    return 'radar-score--low';
  }
}
