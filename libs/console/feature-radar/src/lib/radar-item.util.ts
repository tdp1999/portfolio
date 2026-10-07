import type { RadarCommentsChip, RadarCommentsSummary, RadarItemImage, RadarSourceMonogram } from './radar.types';

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

/** An item's comment capture state as the Detail page and the Feed's progress icons show it. */
export function toCommentsChip(c: RadarCommentsSummary, wantsComments = false): RadarCommentsChip {
  const counted = `${c.fetchedCount} / ${c.postCount}`;
  switch (c.status) {
    case 'FETCHED':
      return {
        label: counted,
        badge: 'console-badge console-badge--muted',
        icon: 'forum',
        tooltip: `${c.fetchedCount} kept of ${c.postCount} on Facebook (spam and filler dropped)`,
        suggested: false,
      };
    case 'PARTIAL':
      return {
        label: counted,
        badge: 'console-badge console-badge--warn',
        icon: 'forum',
        tooltip: 'Partial: the fetch hit its charge cap before this post was read in full',
        suggested: false,
      };
    case 'FAILED':
      return {
        label: 'Failed',
        badge: 'console-badge console-badge--danger',
        icon: 'error_outline',
        tooltip: c.error ? `Fetching comments failed: ${c.error}` : 'Fetching comments failed',
        suggested: wantsComments,
      };
    default:
      return {
        label: String(c.postCount),
        badge: 'radar-comments--idle',
        icon: 'chat_bubble_outline',
        tooltip: wantsComments
          ? `${c.postCount} on Facebook, not fetched. The analysis suggests fetching them.`
          : `${c.postCount} on Facebook, not fetched`,
        suggested: wantsComments,
      };
  }
}

/** Monogram tones: six fixed ones, so a name keeps its tone on every row and every visit. */
const MONOGRAM_TONES = 6;

/** A source's display name as a monogram: "Duy Nguyen (mrgoonie)" reads as "DN". The handle in brackets is dropped. */
export function toSourceMonogram(displayName: string): RadarSourceMonogram {
  const name = displayName.replace(/\(.*?\)/g, '').trim() || displayName.trim();
  const words = name.split(/\s+/).filter(Boolean);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase();
  let hash = 0;
  for (const ch of displayName) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { initials, tone: hash % MONOGRAM_TONES };
}
