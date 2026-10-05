import type { RadarItemImage } from './radar.types';

/** A photo the browser can show: stored or still pending, and not seen failing to load. */
export const isViewableImage = (img: RadarItemImage, broken: ReadonlySet<string>): boolean =>
  img.type === 'photo' && img.storageStatus !== 'failed' && !broken.has(img.url);

/** `https://www.example.com/a` to `example.com`; a value that is not a URL comes back unchanged. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
