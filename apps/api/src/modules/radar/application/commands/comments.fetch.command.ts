import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarCommentsStatus } from '@prisma/client';

import {
  BadRequestError,
  ErrorLayer,
  ExternalServiceError,
  NotFoundError,
  RadarErrorCode,
} from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { COMMENT_TIER_INPUT, NO_REPLIES_MIN_COMMENTS } from '../../domain/radar-comments';
import { CommentsJobRequest, ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarCommentsRepository, RadarCommentCandidate } from '../ports/radar-comments.repository.port';
import { DEFAULT_ITEM_COMMENTS_MAX_CHARGE_USD } from '../radar-capture.config';
import { applyComments, reachedChargeCap, worstCaseUsd } from '../radar-comments.apply';
import { RadarItemCommentsFetchDto } from '../radar.dto';
import { COMMENTS_PROVIDER, RADAR_COMMENTS_REPOSITORY } from '../radar.token';

const PAGE_SIZE = 1000;
/** A provider job id: letters and digits only, so it is safe in the provider's URL path. */
const JOB_REF = /^[A-Za-z0-9]{1,64}$/;

/**
 * The Detail page's "Fetch comments", step 1: starts a job for one post and returns its ref. The
 * Owner asked for this post, so the tier rule (which skips memes and quiet posts) does not apply;
 * only a very large thread drops replies. The page then polls {@link CollectItemCommentsCommand}:
 * no request waits on the provider, so a proxy timeout never loses a billed result.
 */
export class FetchItemCommentsCommand {
  constructor(readonly itemId: string) {}
}

/** Step 2: reads the job; once it finished, replaces the item's comments with its result. */
export class CollectItemCommentsCommand {
  constructor(
    readonly itemId: string,
    readonly jobRef: string
  ) {}
}

@CommandHandler(FetchItemCommentsCommand)
export class FetchItemCommentsHandler implements ICommandHandler<FetchItemCommentsCommand> {
  private readonly logger = new Logger(FetchItemCommentsHandler.name);

  constructor(
    @Inject(COMMENTS_PROVIDER) private readonly provider: ICommentsProvider,
    @Inject(RADAR_COMMENTS_REPOSITORY) private readonly comments: IRadarCommentsRepository
  ) {}

  async execute({ itemId }: FetchItemCommentsCommand): Promise<RadarItemCommentsFetchDto> {
    const item = await findItem(this.comments, itemId);
    if (!this.provider.isConfigured()) {
      throw BadRequestError('Comments capture is not configured (APIFY_TOKEN is unset)', {
        errorCode: RadarErrorCode.CAPTURE_NOT_CONFIGURED,
        layer: ErrorLayer.APPLICATION,
      });
    }
    try {
      return { state: 'running', jobRef: await this.provider.start(jobRequest(item)) };
    } catch (error) {
      throw await fetchFailed(this.comments, this.logger, itemId, error);
    }
  }
}

@CommandHandler(CollectItemCommentsCommand)
export class CollectItemCommentsHandler implements ICommandHandler<CollectItemCommentsCommand> {
  private readonly logger = new Logger(CollectItemCommentsHandler.name);

  constructor(
    @Inject(COMMENTS_PROVIDER) private readonly provider: ICommentsProvider,
    @Inject(RADAR_COMMENTS_REPOSITORY) private readonly comments: IRadarCommentsRepository
  ) {}

  async execute({ itemId, jobRef }: CollectItemCommentsCommand): Promise<RadarItemCommentsFetchDto> {
    const item = await findItem(this.comments, itemId);
    if (!JOB_REF.test(jobRef)) {
      throw BadRequestError('Invalid comments job reference', {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
      });
    }

    let raw: unknown[];
    let stopped: boolean;
    try {
      const status = await this.provider.poll(jobRef);
      if (status.state === 'running') return { state: 'running', jobRef };
      if (status.state === 'failed') throw new Error(status.message);
      raw = [];
      for (let offset = 0; offset < status.itemCount; offset += PAGE_SIZE) {
        raw.push(...(await this.provider.fetchPage(status.datasetRef, offset, PAGE_SIZE)));
      }
      stopped = status.stopped;
    } catch (error) {
      throw await fetchFailed(this.comments, this.logger, itemId, error);
    }

    const request = jobRequest(item);
    const now = new Date();
    const result = this.provider.normalize(raw, [item]);
    const { partial } = await applyComments(this.comments, result, [item], {
      capHit: stopped || reachedChargeCap(raw.length, request.maxChargeUsd, worstCaseUsd(request.tier, 1)),
      resultsLimit: request.tier.resultsLimit,
      onlyMatched: false,
      now,
    });
    return {
      state: 'done',
      jobRef,
      status: partial > 0 ? RadarCommentsStatus.PARTIAL : RadarCommentsStatus.FETCHED,
      fetchedCount: result.byPermalink.get(item.permalink)?.length ?? 0,
    };
  }
}

async function findItem(comments: IRadarCommentsRepository, itemId: string): Promise<RadarCommentCandidate> {
  IdentifierValue.from(itemId);
  const item = await comments.findCandidate(itemId);
  if (!item) {
    throw NotFoundError('Radar item not found', {
      errorCode: RadarErrorCode.ITEM_NOT_FOUND,
      layer: ErrorLayer.APPLICATION,
    });
  }
  return item;
}

/** Same post, same request on both steps: the collect step needs the tier and cap the job ran with. */
function jobRequest(item: RadarCommentCandidate): CommentsJobRequest {
  const tier = item.engagement.comments >= NO_REPLIES_MIN_COMMENTS ? 'full-flat' : 'full';
  return {
    postUrls: [item.permalink],
    tier: COMMENT_TIER_INPUT[tier],
    maxChargeUsd: DEFAULT_ITEM_COMMENTS_MAX_CHARGE_USD,
  };
}

/** Marks the item FAILED (the Detail page shows why) and builds the error the page toasts. */
async function fetchFailed(comments: IRadarCommentsRepository, logger: Logger, itemId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  logger.warn(`Radar item ${itemId}: fetching comments failed: ${message}`);
  await comments.markFailed([itemId], message);
  return ExternalServiceError('Fetching comments failed', error instanceof Error ? error : undefined, {
    errorCode: RadarErrorCode.COMMENTS_FETCH_FAILED,
  });
}
