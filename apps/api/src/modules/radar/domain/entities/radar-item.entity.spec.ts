import { RadarCommentsStatus } from '@prisma/client';

import { radarItem } from '../__fixtures__/radar-item.fixture';
import { RadarComment } from '../radar-comment.types';
import { RadarItemProps } from '../radar-item.types';
import { RadarCommentThread } from '../value-objects/radar-comment-thread';
import { RadarItem } from './radar-item.entity';

const NOW = new Date('2026-10-06T10:00:00Z');
const comment = (id: string) => ({ id, parentId: null, depth: 0 }) as RadarComment;
const fetch = { capHit: false, resultsLimit: 50 };

describe('RadarItem', () => {
  it('should replace stored comments with a fetched thread and clear an earlier failure', () => {
    const failed = radarItem({ comments: [comment('old')] }).markCommentsFailed('Apify 402');
    const thread = RadarCommentThread.stored([comment('a'), comment('b')]);

    const fetched = failed.withComments(thread, fetch, NOW);

    expect(fetched.comments.map((c) => c.id)).toEqual(['a', 'b']);
    expect(fetched).toMatchObject({
      commentsStatus: RadarCommentsStatus.FETCHED,
      commentsFetchedCount: 2,
      commentsFetchedAt: NOW,
      commentsError: null,
    });
  });

  it('should keep stored comments when a fetch fails, and cut the error', () => {
    const failed = radarItem({ comments: [comment('kept')] }).markCommentsFailed(
      'x'.repeat(RadarItem.MAX_COMMENTS_ERROR + 10)
    );

    expect(failed.commentsStatus).toBe(RadarCommentsStatus.FAILED);
    expect(failed.comments.map((c) => c.id)).toEqual(['kept']);
    expect(failed.commentsError).toHaveLength(RadarItem.MAX_COMMENTS_ERROR);
  });

  it.each<[string, Partial<RadarItemProps>, object]>([
    [
      'no count, links or media',
      { engagement: { likes: 0, comments: 0, shares: 0, views: null } },
      { commentCount: 0, hasLinks: false, hasMedia: false },
    ],
    [
      'a count, a link and a photo',
      {
        engagement: { likes: 0, comments: 12, shares: 0, views: null },
        links: [{ url: 'https://example.com', origin: 'post' }],
        media: [{ type: 'photo', url: 'https://cdn.test/1.jpg', thumbnailUrl: null }] as RadarItemProps['media'],
      },
      { commentCount: 12, hasLinks: true, hasMedia: true },
    ],
  ])('should describe a post with %s to the tier policy', (_, over, expected) => {
    expect(radarItem(over).commentPost).toMatchObject(expected);
  });
});
