import { RadarCommentsStatus, RadarWorkStatus } from '@prisma/client';

import { RadarComment, RadarCommentPost, RadarCommentsFetch } from '../radar-comment.types';
import { RadarItemProps } from '../radar-item.types';
import { RadarEngagement, RadarLink, RadarMedia } from '../radar.types';
import { RadarCommentThread } from '../value-objects/radar-comment-thread';

/** A captured post, as far as its comments and its analysis go. */
export class RadarItem {
  // --- Constants ---

  /** Longest comments error stored on an item. */
  static readonly MAX_COMMENTS_ERROR = 500;

  private constructor(private readonly props: RadarItemProps) {}

  // --- Factory Methods ---

  static load(props: RadarItemProps): RadarItem {
    return new RadarItem(props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get permalink(): string {
    return this.props.permalink;
  }

  get authorExternalId(): string | null {
    return this.props.authorExternalId;
  }

  get text(): string {
    return this.props.text;
  }

  get publishedAt(): Date {
    return this.props.publishedAt;
  }

  get engagement(): RadarEngagement {
    return this.props.engagement;
  }

  get links(): readonly RadarLink[] {
    return this.props.links;
  }

  get media(): readonly RadarMedia[] {
    return this.props.media;
  }

  get workStatus(): RadarWorkStatus {
    return this.props.workStatus;
  }

  get leaseExpiresAt(): Date | null {
    return this.props.leaseExpiresAt;
  }

  get comments(): readonly RadarComment[] {
    return this.props.comments;
  }

  get commentsStatus(): RadarCommentsStatus {
    return this.props.commentsStatus;
  }

  get commentsFetchedAt(): Date | null {
    return this.props.commentsFetchedAt;
  }

  get commentsFetchedCount(): number {
    return this.props.commentsFetchedCount;
  }

  get commentsError(): string | null {
    return this.props.commentsError;
  }

  /** What the comment tier rule reads from the post. */
  get commentPost(): RadarCommentPost {
    return {
      text: this.props.text,
      commentCount: this.props.engagement.comments ?? 0,
      hasLinks: this.props.links.length > 0,
      hasMedia: this.props.media.length > 0,
    };
  }

  // --- Rules ---

  /**
   * Replaces the stored comments with a fetched thread (re-capture never duplicates). PARTIAL when
   * the fetch stopped early and this post could have been cut short.
   */
  withComments(thread: RadarCommentThread, fetch: RadarCommentsFetch, now: Date): RadarItem {
    return new RadarItem({
      ...this.props,
      comments: [...thread.comments],
      commentsStatus: thread.fetchStatus(fetch, this.props.engagement.comments),
      commentsFetchedAt: now,
      commentsFetchedCount: thread.size,
      commentsError: null,
    });
  }

  /** Keeps any comments already stored; only the status and the error change. */
  markCommentsFailed(error: string): RadarItem {
    return new RadarItem({
      ...this.props,
      commentsStatus: RadarCommentsStatus.FAILED,
      commentsError: error.slice(0, RadarItem.MAX_COMMENTS_ERROR),
    });
  }

  /** An enrichment was stored: the item is analyzed and its lease is over. */
  takeEnrichment(): RadarItem {
    return new RadarItem({ ...this.props, workStatus: RadarWorkStatus.DONE, leaseExpiresAt: null });
  }

  toProps(): RadarItemProps {
    return { ...this.props };
  }
}
