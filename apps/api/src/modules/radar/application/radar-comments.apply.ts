import { RadarCommentsStatus } from '@prisma/client';

import { RadarCommentPost, RadarCommentTierInput } from '../domain/radar-comments';
import { RadarCommentsNormalizeResult, RadarCommentsReceived } from './ports/comments-provider.port';
import { IRadarCommentsRepository, RadarCommentCandidate } from './ports/radar-comments.repository.port';
import { ACTOR_START_PRICE_USD, COMMENT_PRICE_USD } from './radar-capture.config';

export interface ApplyCommentsOptions {
  /** The provider stopped before finishing (charge cap, timeout, abort): a short post may be cut short. */
  capHit: boolean;
  /** Top-level comments asked for per post; with `capHit`, a post that got fewer may be PARTIAL. */
  resultsLimit: number;
  /** A Manual upload only touches posts it contains; a fetch also settles the posts that got nothing. */
  onlyMatched: boolean;
  now: Date;
}

export interface ApplyCommentsResult {
  fetched: number;
  partial: number;
}

/** Writes a normalized comments batch onto its items, replacing each item's previous list. */
export async function applyComments(
  repo: IRadarCommentsRepository,
  result: RadarCommentsNormalizeResult,
  targets: readonly RadarCommentCandidate[],
  options: ApplyCommentsOptions
): Promise<ApplyCommentsResult> {
  let fetched = 0;
  let partial = 0;

  for (const target of targets) {
    const comments = result.byPermalink.get(target.permalink);
    if (!comments && options.onlyMatched) continue;

    const status =
      options.capHit && cutShort(result.received.get(target.permalink), options.resultsLimit, target)
        ? RadarCommentsStatus.PARTIAL
        : RadarCommentsStatus.FETCHED;
    await repo.saveComments({ itemId: target.id, comments: comments ?? [], status, fetchedAt: options.now });
    if (status === RadarCommentsStatus.PARTIAL) partial++;
    else fetched++;
  }
  return { fetched, partial };
}

/**
 * Fewer top-level comments than asked for and fewer comments in all than Facebook counts. The
 * post's count includes replies, so a thread whose replies make up the difference is complete.
 */
const cutShort = (received: RadarCommentsReceived | undefined, resultsLimit: number, target: RadarCommentCandidate) =>
  (received?.topLevel ?? 0) < resultsLimit && (received?.total ?? 0) < target.engagement.comments;

/** Slack over a job's worst case, so the event that would have reached the cap still fits. */
export const CHARGE_CAP_SLACK_USD = 2 * COMMENT_PRICE_USD;

/** The most a job can cost: bounded without replies, unbounded with them (replies have no limit). */
export const worstCaseUsd = (tier: RadarCommentTierInput, posts: number) =>
  tier.includeReplies ? Infinity : posts * tier.resultsLimit * COMMENT_PRICE_USD + ACTOR_START_PRICE_USD;

/**
 * True when billing reached the cap: Apify ends a capped run as SUCCEEDED, so the item count is
 * the only sign. A cap that covers the job's worst case cannot be reached.
 */
export const reachedChargeCap = (itemCount: number, maxChargeUsd: number, worstCase = Infinity) =>
  maxChargeUsd < worstCase &&
  itemCount * COMMENT_PRICE_USD + ACTOR_START_PRICE_USD >= maxChargeUsd - CHARGE_CAP_SLACK_USD;

export const toCommentPost = (item: RadarCommentCandidate): RadarCommentPost => ({
  text: item.text,
  commentCount: item.engagement.comments ?? 0,
  hasLinks: item.links.length > 0,
  hasMedia: item.media.length > 0,
});
