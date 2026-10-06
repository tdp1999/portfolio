import { RadarCommentPost } from '../radar-comment.types';
import { RadarCommentTierPolicy } from './radar-comment-tier.policy';

const LONG_CAPTION =
  'Mình tổng hợp lại cách dùng Claude Code với MCP cho dự án frontend, có so sánh vài setup khác nhau.';

const post = (over: Partial<RadarCommentPost>): RadarCommentPost => ({
  text: LONG_CAPTION,
  commentCount: 30,
  hasLinks: false,
  hasMedia: false,
  ...over,
});

describe('RadarCommentTierPolicy.select', () => {
  it.each<[string, Partial<RadarCommentPost>, string]>([
    ['under 3 comments', { commentCount: 2, text: 'link dưới còm 👇' }, 'skip'],
    ['giveaway bait, however many comments', { commentCount: 400, text: 'Comment "ok" để nhận file prompt' }, 'light'],
    ['meme: media, no link, no pointer, short caption', { hasMedia: true, text: 'Dev năm 2026 #ai #meme' }, 'skip'],
    ['quiet post that points to its comments', { commentCount: 5, text: 'Link repo dưới còm nha' }, 'light'],
    ['quiet post that does not point to comments', { commentCount: 10 }, 'skip'],
    ['discussion from 20 comments', { commentCount: 20 }, 'full'],
    ['100+ comments drop replies', { commentCount: 100 }, 'full-flat'],
  ])('%s', (_, over, tier) => {
    expect(RadarCommentTierPolicy.select(post(over))).toBe(tier);
  });
});

describe('RadarCommentTierPolicy.forRequestedPost', () => {
  it.each([
    [99, 'full'],
    [100, 'full-flat'],
  ])('%i comments -> %s', (commentCount, tier) => {
    expect(RadarCommentTierPolicy.forRequestedPost(commentCount)).toBe(tier);
  });
});
