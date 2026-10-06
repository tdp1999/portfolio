import { RadarCommentsStatus, RadarWorkStatus } from '@prisma/client';

import { RadarItem } from '../entities/radar-item.entity';
import { RadarItemProps } from '../radar-item.types';

/** A loaded item with no comments fetched and no claim yet. For specs only. */
export const radarItem = (over: Partial<RadarItemProps> = {}): RadarItem =>
  RadarItem.load({
    id: '01a10b5b-9d90-753e-a6a3-000000000101',
    permalink: 'https://www.facebook.com/page/posts/1',
    authorExternalId: 'author',
    text: 'post',
    publishedAt: new Date('2026-10-01T00:00:00Z'),
    engagement: { likes: 0, comments: 10, shares: 0, views: null },
    links: [],
    media: [],
    workStatus: RadarWorkStatus.PENDING,
    leaseExpiresAt: null,
    comments: [],
    commentsStatus: RadarCommentsStatus.NOT_FETCHED,
    commentsFetchedAt: null,
    commentsFetchedCount: 0,
    commentsError: null,
    ...over,
  });
