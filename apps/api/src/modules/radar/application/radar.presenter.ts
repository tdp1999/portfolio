import { RadarRunFlow, RadarStep } from '@prisma/client';

import type { AiUsageSummary } from '../../ai';

import { RadarBrief } from '../domain/entities/radar-brief.entity';
import { RadarRun } from '../domain/entities/radar-run.entity';
import { RadarCommentThread } from '../domain/value-objects/radar-comment-thread';
import { servedUrl } from '../domain/radar-media.util';
import { RadarMedia } from '../domain/radar.types';
import { RadarLeasePolicy } from '../domain/policies/radar-lease.policy';
import { RadarBriefSummary, RadarBriefWorkItem } from './ports/radar-brief.repository.port';
import { RadarFeedRow, RadarItemDetail } from './ports/radar-item.repository.port';
import { RadarWorkSnapshot } from './ports/radar-work.repository.port';
import { RadarSourceListing } from './ports/radar-source.repository.port';
import {
  FEED_PREVIEW_CHARS,
  RadarBriefDetailDto,
  RadarBriefDto,
  RadarBriefWorkItemDto,
  RadarFeedItemDto,
  RadarImagesSummaryDto,
  RadarItemCommentsSummaryDto,
  RadarItemDetailDto,
  RadarItemImageDto,
  RadarRunDetailDto,
  RadarRunDto,
  RadarSourceResponseDto,
  RadarWorkImageDto,
  RadarWorkItemDto,
} from './radar.dto';

const toImages = (media: RadarMedia[]): RadarWorkImageDto[] =>
  media.map((m) => ({ type: m.type, url: servedUrl(m), ocrText: m.ocrText }));

const toImagesSummary = (media: RadarMedia[]): RadarImagesSummaryDto => ({
  total: media.length,
  pending: media.filter((m) => m.storageStatus === 'pending').length,
  failed: media.filter((m) => m.storageStatus === 'failed').length,
});

/** The row's queue facts, with the source's state folded in. */
const toQueueState = (row: Pick<RadarFeedRow, 'workStatus' | 'claimCount' | 'leaseExpiresAt' | 'source'>, now: Date) =>
  RadarLeasePolicy.queueState({ ...row, sourceActive: row.source.isActive }, now);

const toItemImages = (media: RadarMedia[]): RadarItemImageDto[] =>
  media.map((m) => ({
    type: m.type,
    url: servedUrl(m),
    storageStatus: m.storageStatus,
    width: m.width,
    height: m.height,
    ocrText: m.ocrText,
  }));

export class RadarPresenter {
  /** Leaves out provider job refs and step meta: internal bookkeeping, not for the console. */
  /** `spentMicroUsd`: the run's recorded AI cost; only AUTO runs carry one (0 before the first call). */
  static toRun(run: RadarRun, spentMicroUsd: number | null = null): RadarRunDto {
    return {
      id: run.id,
      kind: run.kind,
      source: run.sourceId && run.sourceName !== null ? { id: run.sourceId, displayName: run.sourceName } : null,
      flow: run.flow,
      status: run.status,
      windowFrom: run.windowFrom,
      windowTo: run.windowTo,
      itemCap: run.itemCap,
      captureAdapter: run.captureAdapter,
      llmAdapter: run.llmAdapter,
      itemsCaptured: run.itemsCaptured,
      itemsCreated: run.itemsCreated,
      itemsUpdated: run.itemsUpdated,
      itemsFailed: run.itemsFailed,
      fetchComments: run.fetchComments,
      budgetMicroUsd: run.budgetMicroUsd,
      spentMicroUsd: run.flow === RadarRunFlow.AUTO ? (spentMicroUsd ?? 0) : null,
      error: run.error,
      warning: run.warning,
      createdAt: run.createdAt,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      steps: run.steps.map((s) => ({
        step: s.step,
        status: s.status,
        adapter: s.adapter,
        error: s.error,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
      })),
    };
  }

  /** The run detail: capture input from CAPTURE, unreadable posts from NORMALIZE, AI spend per feature. */
  static toRunDetail(run: RadarRun, aiSpend: AiUsageSummary['byFeature'] | null): RadarRunDetailDto {
    // A re-analysis has no CAPTURE or NORMALIZE step, so look them up instead of `run.step()`.
    const stepOf = (step: RadarStep) => run.steps.find((s) => s.step === step);
    const failureLog = stepOf(RadarStep.NORMALIZE)?.failureLog;
    return {
      ...RadarPresenter.toRun(run, aiSpend?.reduce((sum, f) => sum + f.costMicroUsd, 0) ?? null),
      captureInput: stepOf(RadarStep.CAPTURE)?.captureInput ?? null,
      captureJobRef: stepOf(RadarStep.CAPTURE)?.providerJobRef ?? null,
      failures: { items: [...(failureLog?.failures ?? [])], dropped: failureLog?.dropped ?? 0 },
      aiSpend:
        run.flow === RadarRunFlow.AUTO
          ? (aiSpend ?? []).map(({ feature, calls, failed, tokensIn, tokensOut, costMicroUsd }) => ({
              feature,
              calls,
              failed,
              tokensIn,
              tokensOut,
              costMicroUsd,
            }))
          : null,
    };
  }

  static toSource({ source, itemCount }: RadarSourceListing): RadarSourceResponseDto {
    return {
      id: source.id,
      platform: source.platform,
      url: source.url,
      displayName: source.displayName,
      isActive: source.isActive,
      itemCount,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  static toWorkItem(item: RadarWorkSnapshot): RadarWorkItemDto {
    return {
      id: item.id,
      kind: item.kind,
      permalink: item.permalink,
      authorName: item.authorName,
      publishedAt: item.publishedAt,
      text: item.text,
      images: toImages(item.media),
      links: item.links,
      sharedPost: item.sharedPost && {
        authorName: item.sharedPost.authorName,
        permalink: item.sharedPost.permalink,
        text: item.sharedPost.text,
        images: toImages(item.sharedPost.media),
      },
      engagement: item.engagement,
      comments: {
        status: item.commentsStatus,
        items: RadarCommentThread.stored(item.comments)
          .forClaim()
          .map(({ id, parentId, depth, isAuthor, authorName, text, likes, replies, links, images }) => ({
            id,
            parentId,
            depth,
            isAuthor,
            authorName,
            text,
            likes,
            replies,
            links,
            images,
          })),
      },
      video: item.video,
    };
  }

  /** `now` places the item in the queue (a lease may have run out since it was claimed). */
  static toFeedItem(row: RadarFeedRow, now: Date): RadarFeedItemDto {
    return {
      id: row.id,
      source: row.source,
      kind: row.kind,
      permalink: row.permalink,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      preview: row.text.slice(0, FEED_PREVIEW_CHARS),
      workStatus: row.workStatus,
      queueState: toQueueState(row, now),
      triageStatus: row.triageStatus,
      workError: row.workError,
      images: toImagesSummary(row.media),
      enrichment: row.enrichment,
      comments: toCommentsSummary(row),
      video: row.videoUrl ? { durationSec: row.videoDurationSec, transcriptStatus: row.transcriptStatus } : null,
    };
  }

  static toItemDetail(detail: RadarItemDetail, now: Date): RadarItemDetailDto {
    const {
      claimCount: _claimCount,
      leaseExpiresAt: _leaseExpiresAt,
      media,
      sharedPost,
      comments,
      commentsStatus,
      commentsFetchedCount,
      commentsFetchedAt,
      commentsError,
      ...item
    } = detail;
    return {
      ...item,
      queueState: toQueueState(detail, now),
      comments: { ...toCommentsSummary(detail), items: comments },
      images: toItemImages(media),
      sharedPost: sharedPost && {
        authorName: sharedPost.authorName,
        permalink: sharedPost.permalink,
        publishedAt: sharedPost.publishedAt,
        text: sharedPost.text,
        images: toItemImages(sharedPost.media),
      },
    };
  }

  static toBrief(brief: RadarBriefSummary): RadarBriefDto {
    return {
      id: brief.id,
      source: brief.sourceId && brief.sourceName ? { id: brief.sourceId, displayName: brief.sourceName } : null,
      windowFrom: brief.windowFrom,
      windowTo: brief.windowTo,
      workStatus: brief.workStatus,
      leaseExpiresAt: brief.leaseExpiresAt,
      itemCount: brief.itemCount,
      producer: brief.producer,
      writer: brief.writer,
      error: brief.error,
      createdAt: brief.createdAt,
    };
  }

  static toBriefDetail(brief: RadarBrief, sourceName: string | null): RadarBriefDetailDto {
    return {
      ...RadarPresenter.toBrief({ ...brief.toProps(), itemCount: brief.itemIds.length, sourceName }),
      body: brief.body,
    };
  }

  static toBriefWorkItem(item: RadarBriefWorkItem): RadarBriefWorkItemDto {
    return { ...item, detailPath: `/radar/items/${item.id}` };
  }
}

/** `postCount` is what Facebook reported on the post; `fetchedCount` what we stored after filtering. */
function toCommentsSummary(row: RadarFeedRow | RadarItemDetail): RadarItemCommentsSummaryDto {
  return {
    status: row.commentsStatus,
    fetchedCount: row.commentsFetchedCount,
    fetchedAt: row.commentsFetchedAt,
    error: row.commentsError,
    postCount: row.engagement.comments ?? 0,
  };
}
