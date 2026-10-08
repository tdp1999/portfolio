import { RadarItemKind } from '@prisma/client';
import { z } from 'zod/v4';

import { finiteNumber, isPlainObject, nonEmptyString } from '@portfolio/shared/utils';

import { ICaptureNormalizer } from '../../application/ports/capture-normalizer.port';
import {
  NormalizedRadarItem,
  RadarLink,
  RadarMedia,
  RadarNormalizeFailure,
  RadarNormalizeResult,
} from '../../domain/radar.types';

export const YOUTUBE_VIDEOS_FORMAT = 'youtube-videos';

/** The fields a video cannot be stored without; the rest of the `videos.list` resource is read defensively. */
const VideoSchema = z.looseObject({
  id: z.string().min(1).max(64),
  snippet: z.looseObject({
    publishedAt: z.iso.datetime(),
    title: z.string(),
  }),
});

type Json = Record<string, unknown>;
type Video = Json & z.infer<typeof VideoSchema>;

/**
 * Maps YouTube Data API `videos.list` resources (parts `snippet,contentDetails,statistics,status`)
 * to {@link NormalizedRadarItem}s. A video is the post: its title and description are the text
 * (RAD-002: as written), its thumbnail the one image, its watch URL the video the transcript
 * reads by URL. Only public videos that have aired are kept: a private, unlisted or upcoming one
 * has nothing a reader could open or a model could watch.
 */
export class YouTubeNormalizer implements ICaptureNormalizer {
  // --- Constants ---

  readonly format = YOUTUBE_VIDEOS_FORMAT;

  /** Description links kept per video; channel footers list many more (socials, sponsors). */
  private static readonly MAX_LINKS = 10;
  private static readonly URL_IN_TEXT = /https?:\/\/[^\s<>"'`]+/g;
  /** `PT1H2M3S`, `P1DT2H`, `P0D` (a live stream that has not ended). */
  private static readonly DURATION = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
  private static readonly THUMBNAILS = ['maxres', 'standard', 'high', 'medium', 'default'];

  normalize(raw: readonly unknown[]): RadarNormalizeResult {
    const items: NormalizedRadarItem[] = [];
    const failures: RadarNormalizeFailure[] = [];
    const seen = new Set<string>();
    let skipped = 0;

    raw.forEach((entry, index) => {
      const parsed = VideoSchema.safeParse(entry);
      if (!parsed.success) {
        failures.push({
          index,
          ref: YouTubeNormalizer.refOf(entry),
          reason: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
        });
        return;
      }
      const video = parsed.data as Video;
      if (seen.has(video.id) || !YouTubeNormalizer.isWatchable(video)) {
        skipped++;
        return;
      }
      seen.add(video.id);
      items.push(YouTubeNormalizer.toItem(video, entry));
    });

    return { items, skipped, failures, notices: [] };
  }

  // --- Private ---

  /** The video's watch URL when the unreadable row still has an id. */
  private static refOf(entry: unknown): string | undefined {
    const id = isPlainObject(entry) ? nonEmptyString(entry['id']) : null;
    return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : undefined;
  }

  private static isWatchable(video: Video): boolean {
    const status = isPlainObject(video['status']) ? video['status'] : {};
    const live = nonEmptyString(video.snippet['liveBroadcastContent']) ?? 'none';
    return status['privacyStatus'] === 'public' && live === 'none';
  }

  private static toItem(video: Video, entry: unknown): NormalizedRadarItem {
    const { snippet } = video;
    const details = isPlainObject(video['contentDetails']) ? video['contentDetails'] : {};
    const stats = isPlainObject(video['statistics']) ? video['statistics'] : {};
    const permalink = `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`;
    const title = snippet.title.trim();
    const description = (nonEmptyString(snippet['description']) ?? '').trim();
    const channelId = nonEmptyString(snippet['channelId']);

    return {
      externalId: video.id,
      provider: YOUTUBE_VIDEOS_FORMAT,
      kind: RadarItemKind.VIDEO,
      permalink,
      authorName: (nonEmptyString(snippet['channelTitle']) ?? 'Unknown').slice(0, 200),
      authorExternalId: channelId && channelId.length <= 64 ? channelId : null,
      publishedAt: new Date(snippet.publishedAt),
      text: description ? `${title}\n\n${description}` : title,
      media: YouTubeNormalizer.toMedia(video.id, snippet['thumbnails']),
      links: YouTubeNormalizer.toLinks(description, video.id),
      sharedPost: null,
      engagement: {
        // The API returns counts as strings; a hidden like count is simply absent.
        likes: YouTubeNormalizer.count(stats['likeCount']) ?? 0,
        comments: YouTubeNormalizer.count(stats['commentCount']) ?? 0,
        shares: 0,
        views: YouTubeNormalizer.count(stats['viewCount']),
      },
      video: { url: permalink, durationSec: YouTubeNormalizer.durationSec(details['duration']) },
      rawPayload: entry,
    };
  }

  /** The largest thumbnail, stored like a post photo so the analysis sees the cover slide. */
  private static toMedia(videoId: string, thumbnails: unknown): RadarMedia[] {
    if (!isPlainObject(thumbnails)) return [];
    for (const size of YouTubeNormalizer.THUMBNAILS) {
      const thumb = thumbnails[size];
      const url = isPlainObject(thumb) ? YouTubeNormalizer.httpUrl(thumb['url']) : null;
      if (!url || !isPlainObject(thumb)) continue;
      return [
        {
          type: 'photo',
          url,
          thumbnailUrl: null,
          width: finiteNumber(thumb['width']),
          height: finiteNumber(thumb['height']),
          ocrText: null,
          externalId: `${videoId}:thumbnail`,
          storedUrl: null,
          storedExternalId: null,
          storageStatus: 'pending',
          storageError: null,
        },
      ];
    }
    return [];
  }

  /** Links written in the description, in order, without the video's own watch URL. */
  private static toLinks(description: string, videoId: string): RadarLink[] {
    const links: RadarLink[] = [];
    for (const match of description.matchAll(YouTubeNormalizer.URL_IN_TEXT)) {
      const url = YouTubeNormalizer.httpUrl(match[0].replace(/[.,;:!?)\]}]+$/, ''));
      if (!url || url.includes(videoId) || links.some((l) => l.url === url)) continue;
      links.push({ url, origin: 'post' });
      if (links.length >= YouTubeNormalizer.MAX_LINKS) break;
    }
    return links;
  }

  /** `PT1H2M3S` to 3,723. Null for a duration YouTube did not give or that is zero (a live stream). */
  private static durationSec(value: unknown): number | null {
    const match = YouTubeNormalizer.DURATION.exec(nonEmptyString(value) ?? '');
    if (!match) return null;
    const [d, h, m, s] = match.slice(1).map((part) => Number(part ?? 0));
    const total = ((d * 24 + h) * 60 + m) * 60 + s;
    return total > 0 ? total : null;
  }

  private static count(value: unknown): number | null {
    const n = typeof value === 'string' ? Number(value) : finiteNumber(value);
    return n !== null && Number.isFinite(n) && n >= 0 ? n : null;
  }

  /** Only plain http(s) URLs within the column limit survive (they are rendered in the console). */
  private static httpUrl(value: unknown): string | null {
    const candidate = nonEmptyString(value);
    return candidate &&
      z
        .url({ protocol: /^https?$/ })
        .max(1000)
        .safeParse(candidate).success
      ? candidate
      : null;
  }
}
