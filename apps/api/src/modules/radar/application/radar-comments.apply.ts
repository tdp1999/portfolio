import { RadarCommentsStatus } from '@prisma/client';

import { RadarItem } from '../domain/entities/radar-item.entity';
import { RadarCommentsFetch } from '../domain/radar-comment.types';
import { RadarCommentThread } from '../domain/value-objects/radar-comment-thread';
import { RadarCommentsNormalizeResult } from './ports/comments-provider.port';
import { IRadarCommentsRepository } from './ports/radar-comments.repository.port';

export interface ApplyCommentsOptions extends RadarCommentsFetch {
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
  targets: readonly RadarItem[],
  options: ApplyCommentsOptions
): Promise<ApplyCommentsResult> {
  let fetched = 0;
  let partial = 0;

  for (const target of targets) {
    const found = result.threads.get(target.permalink);
    if (!found && options.onlyMatched) continue;

    const item = target.withComments(found ?? RadarCommentThread.empty(), options, options.now);
    await repo.saveComments(item);
    if (item.commentsStatus === RadarCommentsStatus.PARTIAL) partial++;
    else fetched++;
  }
  return { fetched, partial };
}

/** Marks the items' comments FAILED, keeping what they already had. */
export async function markCommentsFailed(
  repo: IRadarCommentsRepository,
  itemIds: readonly string[],
  error: string
): Promise<void> {
  const items = await repo.findByIds(itemIds);
  await repo.saveCommentsFailure(items.map((item) => item.markCommentsFailed(error)));
}
