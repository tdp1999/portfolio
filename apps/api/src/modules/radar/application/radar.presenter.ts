import { RadarRun } from '../domain/entities/radar-run.entity';
import { RadarCommentThread } from '../domain/value-objects/radar-comment-thread';
import { servedUrl } from '../domain/radar-media.util';
import { RadarMedia } from '../domain/radar.types';
import { RadarFeedRow, RadarItemDetail } from './ports/radar-item.repository.port';
import { ClaimedRadarItem } from './ports/radar-work.repository.port';
import { RadarSourceListing } from './ports/radar-source.repository.port';
import {
  FEED_PREVIEW_CHARS,
  RadarFeedItemDto,
  RadarItemCommentsSummaryDto,
  RadarItemDetailDto,
  RadarItemImageDto,
  RadarRunDto,
  RadarSourceResponseDto,
  RadarWorkImageDto,
  RadarWorkItemDto,
} from './radar.dto';

const toImages = (media: RadarMedia[]): RadarWorkImageDto[] =>
  media.map((m) => ({ type: m.type, url: servedUrl(m), ocrText: m.ocrText }));

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
  static toRun(run: RadarRun): RadarRunDto {
    return {
      id: run.id,
      source: { id: run.sourceId, displayName: run.sourceName },
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

  static toWorkItem(item: ClaimedRadarItem): RadarWorkItemDto {
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
    };
  }

  static toFeedItem(row: RadarFeedRow): RadarFeedItemDto {
    return {
      id: row.id,
      source: row.source,
      kind: row.kind,
      permalink: row.permalink,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      preview: row.text.slice(0, FEED_PREVIEW_CHARS),
      workStatus: row.workStatus,
      enrichment: row.enrichment,
      comments: toCommentsSummary(row),
    };
  }

  static toItemDetail(detail: RadarItemDetail): RadarItemDetailDto {
    const {
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
