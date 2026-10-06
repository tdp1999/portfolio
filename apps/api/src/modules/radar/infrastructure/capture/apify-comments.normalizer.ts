import { z } from 'zod/v4';

import { finiteNumber, isPlainObject, nonEmptyString } from '@portfolio/shared/utils';

import {
  keepComments,
  labelComments,
  MAX_COMMENT_TEXT,
  RadarComment,
  RadarCommentDraft,
  RadarCommentImage,
} from '../../domain/radar-comments';
import { RadarNormalizeFailure } from '../../domain/radar.types';
import {
  RadarCommentsNormalizeResult,
  RadarCommentsReceived,
  RadarCommentTarget,
} from '../../application/ports/comments-provider.port';

export const APIFY_FACEBOOK_COMMENTS_FORMAT = 'apify-facebook-comments';

const ApifyCommentSchema = z.looseObject({
  id: z.string().min(1).max(200),
  text: z.string().optional(),
});

type Json = Record<string, unknown>;

/** Query params that name the post itself (`permalink.php?story_fbid=…&id=…`, `photo.php?fbid=…`, `watch/?v=…`). */
const POST_ID_PARAMS = ['story_fbid', 'fbid', 'id', 'v'];

/**
 * Tracking params, fragment and trailing slash differ between the URL we send and the one the
 * actor echoes; the params that identify the post are kept, so two such posts never share a key.
 */
export function canonicalPostUrl(url: string): string {
  const [base, query = ''] = url.split('#')[0].split('?');
  const params = new URLSearchParams(query);
  const kept = POST_ID_PARAMS.filter((key) => params.has(key)).map((key) => `${key}=${params.get(key)}`);
  return base.replace(/\/+$/, '') + (kept.length ? `?${kept.join('&')}` : '');
}

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

const URL_IN_TEXT = /https?:\/\/[^\s<>"')]+/g;
/** The page's pinned "subscribe now" promo rides along as an attachment link; it is not content. */
const isPromoLink = (url: string) => /facebook\.com\/[^/]+\/subscribenow/.test(url);

/**
 * Maps `apify/facebook-comments-scraper` dataset items to stored comments, grouped by post.
 * Matching uses the URL the actor was given (`inputUrl`), then the post URL it resolved
 * (`facebookUrl`), so a Manual upload made from the actor console matches too.
 */
export function normalizeApifyComments(
  raw: readonly unknown[],
  targets: readonly RadarCommentTarget[]
): RadarCommentsNormalizeResult {
  const targetByUrl = new Map(targets.map((t) => [canonicalPostUrl(t.permalink), t]));
  const drafts = new Map<RadarCommentTarget, RadarCommentDraft[]>();
  const seen = new Set<string>();
  const failures: RadarNormalizeFailure[] = [];
  let unmatched = 0;

  raw.forEach((entry, index) => {
    const parsed = ApifyCommentSchema.safeParse(entry);
    if (!parsed.success) {
      failures.push({ index, reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      return;
    }
    const comment = parsed.data as Json & { id: string };
    const target = [comment['inputUrl'], comment['facebookUrl']]
      .map(nonEmptyString)
      .map((url) => (url ? targetByUrl.get(canonicalPostUrl(url)) : undefined))
      .find(Boolean);
    if (!target) {
      unmatched++;
      return;
    }
    if (seen.has(comment.id)) return;
    seen.add(comment.id);

    const list = drafts.get(target) ?? [];
    list.push(toDraft(comment, target));
    drafts.set(target, list);
  });

  const byPermalink = new Map<string, RadarComment[]>();
  const received = new Map<string, RadarCommentsReceived>();
  for (const [target, list] of drafts) {
    byPermalink.set(target.permalink, keepComments(labelComments(list)));
    received.set(target.permalink, { topLevel: list.filter((c) => c.depth === 0).length, total: list.length });
  }
  return { byPermalink, received, unmatched, failures };
}

function toDraft(comment: Json & { id: string }, target: RadarCommentTarget): RadarCommentDraft {
  const author = isPlainObject(comment['author']) ? comment['author'] : {};
  const profileId = nonEmptyString(comment['profileId']) ?? nonEmptyString(author['id']);
  const isAuthor = profileId !== null && profileId === target.authorExternalId;
  const text = (nonEmptyString(comment['text']) ?? '').trim().slice(0, MAX_COMMENT_TEXT);
  const attachments = Array.isArray(comment['attachments']) ? comment['attachments'].filter(isPlainObject) : [];
  const depth = finiteNumber(comment['threadingDepth']) ?? 0;

  return {
    id: comment.id,
    parentId: depth > 0 ? nonEmptyString(comment['replyToCommentId']) : null,
    depth,
    isAuthor,
    authorName: isAuthor ? (nonEmptyString(comment['profileName']) ?? nonEmptyString(author['name'])) : null,
    text,
    publishedAt: nonEmptyString(comment['date']),
    // The actor sends likes as a string ("2").
    likes: finiteNumber(Number(comment['likesCount'])) ?? 0,
    replies: finiteNumber(comment['commentsCount']) ?? 0,
    links: toLinks(text, attachments),
    images: toImages(attachments),
    profileId,
  };
}

/** Links written in the text, plus a link preview's target (`attachments[].url`). */
function toLinks(text: string, attachments: Json[]): string[] {
  const found = [...(text.match(URL_IN_TEXT) ?? []), ...attachments.map((a) => a['url'])];
  return [...new Set(found.map(httpUrl).filter((u): u is string => u !== null && !isPromoLink(u)))];
}

function toImages(attachments: Json[]): RadarCommentImage[] {
  return attachments.flatMap((a) => {
    if (a['__typename'] !== 'Photo') return [];
    const image = isPlainObject(a['image']) ? a['image'] : {};
    const url = httpUrl(image['uri']);
    return url ? [{ url, ocrText: nonEmptyString(a['ocrText']) }] : [];
  });
}
