import { PLATFORM_LABELS } from './radar.data';
import type {
  RadarCommentsChip,
  RadarCommentsSummary,
  RadarItemDetail,
  RadarItemImage,
  RadarPlatform,
  RadarSourceMonogram,
} from './radar.types';

/**
 * Analyzed once and back in the queue: the old analysis shows until the new one lands. A stuck
 * post is not queued (its retries ran out), so it keeps the Re-analyze button that resets it.
 */
export const isReanalysisQueued = (item: Pick<RadarItemDetail, 'enrichment' | 'workStatus' | 'queueState'>): boolean =>
  !!item.enrichment && item.workStatus !== 'DONE' && item.queueState !== 'stuck';

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
export function toCommentsChip(
  c: RadarCommentsSummary,
  wantsComments = false,
  platform: RadarPlatform = 'FACEBOOK'
): RadarCommentsChip {
  const where = PLATFORM_LABELS[platform];
  // Only a Facebook post's comments can be fetched, so only there may the analysis suggest it.
  const wantsFetch = wantsComments && platform === 'FACEBOOK';
  const counted = `${c.fetchedCount} / ${c.postCount}`;
  switch (c.status) {
    case 'FETCHED':
      return {
        label: counted,
        badge: 'console-badge console-badge--muted',
        icon: 'forum',
        tooltip: `${c.fetchedCount} kept of ${c.postCount} on ${where} (spam and filler dropped)`,
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
        suggested: wantsFetch,
      };
    default:
      return {
        label: String(c.postCount),
        badge: 'radar-comments--idle',
        icon: 'chat_bubble_outline',
        tooltip: wantsFetch
          ? `${c.postCount} on ${where}, not fetched. The analysis suggests fetching them.`
          : `${c.postCount} on ${where}, not fetched`,
        suggested: wantsFetch,
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

/** Seconds as a clock time: 75 → "1:15", 3_725 → "1:02:05". */
export function toClockTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = String(totalSec % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
