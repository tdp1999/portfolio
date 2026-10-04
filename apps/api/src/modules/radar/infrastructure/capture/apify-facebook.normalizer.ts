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

/** Links end up rendered in the console, so only plain http(s) URLs survive (no `javascript:`). */
const httpUrl = (value: unknown): string | null => {
  const candidate = nonEmptyString(value);
  return candidate &&
    z
      .url({ protocol: /^https?$/ })
      .max(1000)
      .safeParse(candidate).success
    ? candidate
    : null;
};

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
    let skipped = 0;

    raw.forEach((entry, index) => {
      const parsed = ApifyPostSchema.safeParse(entry);
      if (!parsed.success) {
        failures.push({ index, reason: describeIssues(parsed.error) });
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

    return { items, skipped, failures };
  }

  private toItem(post: Json & z.infer<typeof ApifyPostSchema>, entry: unknown): NormalizedRadarItem {
    const user = isPlainObject(post['user']) ? post['user'] : {};
    const sharedPost = isPlainObject(post['sharedPost']) ? toSharedPost(post['sharedPost']) : null;

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
      links: toLinks(post, sharedPost),
      sharedPost,
      engagement: {
        likes: finiteNumber(post['likes']) ?? 0,
        comments: finiteNumber(post['comments']) ?? 0,
        shares: finiteNumber(post['shares']) ?? 0,
        views: finiteNumber(post['viewsCount']) ?? finiteNumber(post['videoPostViewCount']),
      },
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
 * Keeps photos and videos only. Album posts lead with a `mediaset_token` wrapper that has no
 * `__typename` and no image; it is dropped along with any `null` slot.
 */
function toMedia(value: unknown): RadarMedia[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((m): RadarMedia[] => {
    if (!isPlainObject(m)) return [];
    const typename = m['__typename'];
    if (typename !== 'Photo' && typename !== 'Video') return [];

    const image = [m['image'], m['photo_image'], m['thumbnailImage']].find(isPlainObject) ?? {};
    const url = nonEmptyString(image['uri']) ?? nonEmptyString(m['thumbnail']);
    if (!url) return [];

    return [
      {
        type: typename === 'Photo' ? 'photo' : 'video',
        url,
        thumbnailUrl: nonEmptyString(m['thumbnail']),
        width: finiteNumber(image['width']),
        height: finiteNumber(image['height']),
        ocrText: nonEmptyString(m['ocrText']),
        externalId: nonEmptyString(m['id']),
        storedUrl: null,
        storedExternalId: null,
        storageStatus: 'pending',
        storageError: null,
      },
    ];
  });
}

/** The page's pinned "subscribe now" promo shows up as `link` on most posts; it is not content. */
const isPromoLink = (url: string) => /facebook\.com\/[^/]+\/subscribenow/.test(url);

function toLinks(post: Json & { url: string }, sharedPost: RadarSharedPost | null): RadarLink[] {
  const links: RadarLink[] = [];
  const link = httpUrl(post['link']);
  if (link && link !== post.url && !isPromoLink(link)) {
    links.push({ url: link, origin: 'post' });
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
    media: toMedia(shared['media']),
  };
}

function describeIssues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}
