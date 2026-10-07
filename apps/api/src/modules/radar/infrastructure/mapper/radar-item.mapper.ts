import { Prisma } from '@prisma/client';

import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarComment } from '../../domain/radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia } from '../../domain/radar.types';
import { RadarItemVideo, RadarTranscript } from '../../domain/radar-transcript.types';

/** The columns {@link RadarItem} is built from. */
export const RADAR_ITEM_SELECT = {
  id: true,
  permalink: true,
  authorExternalId: true,
  text: true,
  publishedAt: true,
  engagement: true,
  links: true,
  media: true,
  workStatus: true,
  leaseExpiresAt: true,
  comments: true,
  commentsStatus: true,
  commentsFetchedAt: true,
  commentsFetchedCount: true,
  commentsError: true,
} satisfies Prisma.RadarItemSelect;

export type RadarItemRow = Prisma.RadarItemGetPayload<{ select: typeof RADAR_ITEM_SELECT }>;

/** The columns {@link RadarItemMapper.toVideo} reads. */
export const RADAR_VIDEO_SELECT = {
  videoUrl: true,
  videoDurationSec: true,
  transcript: true,
  transcriptStatus: true,
  transcriptError: true,
} satisfies Prisma.RadarItemSelect;

type RadarVideoRow = Prisma.RadarItemGetPayload<{ select: typeof RADAR_VIDEO_SELECT }>;

export class RadarItemMapper {
  static toDomain(row: RadarItemRow): RadarItem {
    return RadarItem.load({
      ...row,
      engagement: row.engagement as unknown as RadarEngagement,
      links: row.links as unknown as RadarLink[],
      media: row.media as unknown as RadarMedia[],
      comments: (row.comments ?? []) as unknown as RadarComment[],
    });
  }

  /** The item's video without its file URL, which stays on the server; null when it has none. */
  static toVideo(row: RadarVideoRow): RadarItemVideo | null {
    if (!row.videoUrl) return null;
    return {
      durationSec: row.videoDurationSec,
      transcriptStatus: row.transcriptStatus,
      transcript: row.transcript as unknown as RadarTranscript | null,
      transcriptError: row.transcriptError,
    };
  }

  /** The comment state, the only part the comments flows write. */
  static toCommentsPersistence(item: RadarItem): Prisma.RadarItemUpdateInput {
    return {
      comments: item.comments as unknown as Prisma.InputJsonValue,
      commentsStatus: item.commentsStatus,
      commentsFetchedAt: item.commentsFetchedAt,
      commentsFetchedCount: item.commentsFetchedCount,
      commentsError: item.commentsError,
    };
  }

  /** The work state, written when an enrichment is stored. */
  static toWorkPersistence(item: RadarItem): Prisma.RadarItemUpdateInput {
    return { workStatus: item.workStatus, leaseExpiresAt: item.leaseExpiresAt };
  }
}
