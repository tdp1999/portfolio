import { Pipe, PipeTransform } from '@angular/core';

export interface RadarSourceMonogram {
  initials: string;
  /** One of six fixed tones, the same for a name on every row and every visit. */
  tone: number;
}

const TONES = 6;

/** A source's display name as a monogram: "Duy Nguyen (mrgoonie)" reads as "DN". The handle in brackets is dropped. */
export function toSourceMonogram(displayName: string): RadarSourceMonogram {
  const name = displayName.replace(/\(.*?\)/g, '').trim() || displayName.trim();
  const words = name.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of displayName) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { initials, tone: hash % TONES };
}

@Pipe({ name: 'radarSourceMonogram', standalone: true })
export class RadarSourceMonogramPipe implements PipeTransform {
  transform(displayName: string): RadarSourceMonogram {
    return toSourceMonogram(displayName);
  }
}
