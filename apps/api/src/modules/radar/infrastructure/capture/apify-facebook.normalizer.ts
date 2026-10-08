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
  RadarSharedPost,
} from '../../domain/radar.types';

export const APIFY_FACEBOOK_POSTS_FORMAT = 'apify-facebook-posts';

/**
 * Only the fields a post cannot exist without. Everything else in the actor output is optional
 * and read defensively, because the actor adds and drops fields between post types.
 */
const ApifyPostSchema = z.looseObject({
  postId: z.string().min(1).max(64),
  // Column limits (radar_items.permalink is VARCHAR(1000)) fail the post here, not the whole transaction.
  url: z.url({ protocol: /^https?$/ }).max(1000),
  time: z.iso.datetime(),
});

type Json = Record<string, unknown>;

/**
 * Links end up rendered in the console, so only plain http(s) URLs survive (no `javascript:`).
 * `max` is the column limit; signed video URLs run past the usual 1,000 characters.
 */
const httpUrlUpTo = (value: unknown, max: number): string | null => {
  const candidate = nonEmptyString(value);
  return candidate &&
    z
      .url({ protocol: /^https?$/ })
      .max(max)
      .safeParse(candidate).success
    ? candidate
    : null;
};
const httpUrl = (value: unknown): string | null => httpUrlUpTo(value, 1000);

/** `radar_items.authorExternalId` is VARCHAR(64); an oversized id is dropped rather than failing the batch. */
const shortId = (value: unknown): string | null => {
  const id = nonEmptyString(value);
  return id && id.length <= 64 ? id : null;
};

/**
 * Maps `apify/facebook-posts-scraper` dataset items to {@link NormalizedRadarItem}s.
 *
 * Text is trimmed and otherwise left exactly as written (RAD-002: source language, terms
 * verbatim). The raw item is kept untouched in `rawPayload` so later fields can be recovered
 * without paying for another scrape.
 */
export class ApifyFacebookNormalizer implements ICaptureNormalizer {
  readonly format = APIFY_FACEBOOK_POSTS_FORMAT;

  normalize(raw: readonly unknown[]): RadarNormalizeResult {
    const items: NormalizedRadarItem[] = [];
    const failures: RadarNormalizeFailure[] = [];
    const seen = new Set<string>();
    const notices: string[] = [];
    let skipped = 0;

    raw.forEach((entry, index) => {
      const notice = ApifyFacebookNormalizer.notice(entry);
      if (notice) {
        notices.push(notice);
        return;
      }
      const parsed = ApifyPostSchema.safeParse(entry);
      if (!parsed.success) {
        failures.push({ index, ref: ApifyFacebookNormalizer.refOf(entry), reason: describeIssues(parsed.error) });
        return;
      }

      const post = parsed.data as Json & z.infer<typeof ApifyPostSchema>;
      if (seen.has(post.postId)) {
        skipped++;
        return;
      }
      seen.add(post.postId);
      items.push(this.toItem(post, entry));
    });

    return { items, skipped, failures, notices };
  }

  /** The post's URL, or its id, when the unreadable row still has one. */
  private static refOf(entry: unknown): string | undefined {
    if (!isPlainObject(entry)) return undefined;
    return nonEmptyString(entry['url']) ?? nonEmptyString(entry['postId']) ?? undefined;
  }

  /**
   * The actor writes one `{ inputUrl, error, errorDescription }` row when it finds nothing, e.g.
   * `no_items` for an empty window. It is a note about the capture, not a post that failed.
   */
  private static notice(entry: unknown): string | null {
    if (!isPlainObject(entry) || 'postId' in entry) return null;
    const code = nonEmptyString(entry['error']);
    if (!code) return null;
    const description = nonEmptyString(entry['errorDescription']);
    const text = code === 'no_items' ? 'Apify found no posts for this source and window' : `Apify reported ${code}`;
    return (description ? `${text}: ${description}` : text).slice(0, 300);
  }

  private toItem(post: Json & z.infer<typeof ApifyPostSchema>, entry: unknown): NormalizedRadarItem {
    const user = isPlainObject(post['user']) ? post['user'] : {};
    const shared = isPlainObject(post['sharedPost']) ? post['sharedPost'] : null;
    const sharedPost = shared ? toSharedPost(shared) : null;

    return {
      externalId: post.postId,
      provider: APIFY_FACEBOOK_POSTS_FORMAT,
      kind: toKind(post, sharedPost !== null),
      permalink: post.url,
      authorName: (nonEmptyString(user['name']) ?? nonEmptyString(post['pageName']) ?? 'Unknown').slice(0, 200),
      authorExternalId: shortId(user['id']),
      publishedAt: new Date(post.time),
      text: (nonEmptyString(post['text']) ?? '').trim(),
      media: toMedia(post['media']),
      links: toLinks(post, sharedPost, httpUrl(shared?.['link'])),
      sharedPost,
      engagement: {
        likes: finiteNumber(post['likes']) ?? 0,
        comments: finiteNumber(post['comments']) ?? 0,
        shares: finiteNumber(post['shares']) ?? 0,
        views: finiteNumber(post['viewsCount']) ?? finiteNumber(post['videoPostViewCount']),
      },
      video: toVideo(post['media']),
      rawPayload: entry,
    };
  }
}

function toKind(post: Json & { url: string }, isShare: boolean): RadarItemKind {
  if (post.url.includes('/reel/')) return RadarItemKind.REEL;
  if (post['isVideo'] === true) return RadarItemKind.VIDEO;
  if (isShare) return RadarItemKind.SHARE;
  return RadarItemKind.POST;
}

/**
 * Keeps photos and videos only, deduplicated by Facebook id across the given lists (shared posts
 * carry media in `media` or `attachments`, depending on the post). Album posts lead with a `mediaset_token` wrapper that has no
 * `__typename` and no image; it is dropped along with any `null` slot.
 */
function toMedia(...lists: unknown[]): RadarMedia[] {
  const seen = new Set<string>();

  return lists
    .flatMap((list) => (Array.isArray(list) ? list : []))
    .flatMap((m): RadarMedia[] => {
      if (!isPlainObject(m)) return [];
      const typename = m['__typename'];
      if (typename !== 'Photo' && typename !== 'Video') return [];

      const image = [m['image'], m['photo_image'], m['thumbnailImage']].find(isPlainObject) ?? {};
      const url = publicCdnUrl(nonEmptyString(image['uri']) ?? nonEmptyString(m['thumbnail']));
      const id = nonEmptyString(m['id']);
      if (!url || (id && seen.has(id))) return [];
      if (id) seen.add(id);

      return [
        {
          type: typename === 'Photo' ? 'photo' : 'video',
          url,
          thumbnailUrl: publicCdnUrl(nonEmptyString(m['thumbnail'])),
          width: finiteNumber(image['width']),
          height: finiteNumber(image['height']),
          ocrText: nonEmptyString(m['ocrText']),
          externalId: id,
          storedUrl: null,
          storedExternalId: null,
          storageStatus: 'pending',
          storageError: null,
        },
      ];
    });
}

/**
 * The post's first video with a playable file. The SD file is preferred: the transcript only needs
 * to read slides and hear speech, and a smaller file keeps the download short.
 */
function toVideo(list: unknown): NormalizedRadarItem['video'] {
  for (const m of Array.isArray(list) ? list : []) {
    if (!isPlainObject(m) || m['__typename'] !== 'Video') continue;
    const delivery = isPlainObject(m['videoDeliveryLegacyFields']) ? m['videoDeliveryLegacyFields'] : {};
    const url = publicCdnUrl(
      httpUrlUpTo(delivery['browser_native_sd_url'], 2000) ?? httpUrlUpTo(delivery['browser_native_hd_url'], 2000)
    );
    if (!url) continue;
    const ms = finiteNumber(m['playable_duration_in_ms']);
    return { url, durationSec: ms !== null && ms > 0 ? Math.ceil(ms / 1000) : null };
  }
  return null;
}

/**
 * The actor sometimes returns URLs on ISP-embedded edge hosts (`scontent.fosu2-2.fna.fbcdn.net`)
 * that only resolve inside that ISP, so our server and the worker cannot download them. The
 * signed path is host-independent, so the public host serves the same file.
 */
function publicCdnUrl(url: string | null): string | null {
  return (
    url
      ?.replace(/^https:\/\/scontent\.[a-z0-9-]+\.fna\.fbcdn\.net\//, 'https://scontent.xx.fbcdn.net/')
      .replace(/^https:\/\/video\.[a-z0-9-]+\.fna\.fbcdn\.net\//, 'https://video.xx.fbcdn.net/') ?? null
  );
}

/** The page's pinned "subscribe now" promo shows up as `link` on most posts; it is not content. */
const isPromoLink = (url: string) => /facebook\.com\/[^/]+\/subscribenow/.test(url);
/** A hashtag in the text surfaces as `link` when the post has no real link; it is not content. */
const isHashtagLink = (url: string) => /facebook\.com\/hashtag\//.test(url);

/** On a share the actor copies the shared post's `link` to the top level; it belongs to the shared post. */
function toLinks(
  post: Json & { url: string },
  sharedPost: RadarSharedPost | null,
  sharedLink: string | null
): RadarLink[] {
  const links: RadarLink[] = [];
  const link = httpUrl(post['link']);
  if (link && link !== post.url && !isPromoLink(link) && !isHashtagLink(link)) {
    links.push({ url: link, origin: link === sharedLink ? 'shared-post' : 'post' });
  }
  if (sharedPost?.permalink) {
    links.push({ url: sharedPost.permalink, origin: 'shared-post' });
  }
  return links;
}

function toSharedPost(shared: Json): RadarSharedPost {
  const user = isPlainObject(shared['user']) ? shared['user'] : {};
  const page = isPlainObject(shared['pageName']) ? shared['pageName'] : {};

  return {
    authorName: nonEmptyString(user['name']) ?? nonEmptyString(page['name']),
    authorExternalId: shortId(user['id']) ?? shortId(page['id']),
    permalink: httpUrl(shared['url']),
    publishedAt: nonEmptyString(shared['time']),
    text: (nonEmptyString(shared['text']) ?? '').trim(),
    media: toMedia(shared['media'], shared['attachments']),
  };
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}
