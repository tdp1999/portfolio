import type { RadarWorkItemDto } from '../radar.dto';
import { RadarAnalysisPrompt } from './radar-analysis.prompt';

const image = (url: string) => ({ type: 'photo' as const, url, ocrText: null });
const comment = (id: string, isAuthor: boolean, text: string) => ({
  id,
  parentId: null,
  depth: 0,
  isAuthor,
  authorName: isAuthor ? 'Goon Nguyen' : 'Một Người',
  text,
  likes: 3,
  replies: 0,
  links: ['https://www.facebook.com/x', 'https://github.com/x'],
  images: [],
});

const item: RadarWorkItemDto = {
  id: 'i1',
  kind: 'POST',
  permalink: 'https://www.facebook.com/mrgoonie/posts/1',
  authorName: 'Goon Nguyen',
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  text: 'Xem https://fb.watch/x và https://claude.com/blog',
  images: [
    image('https://res.cloudinary.com/demo/a.png'),
    image('https://scontent.fbcdn.net/b.jpg'),
    ...['c', 'd', 'e'].map((n) => image(`https://res.cloudinary.com/demo/${n}.jpg`)),
  ],
  links: [
    { url: 'https://www.facebook.com/groups/1', origin: 'post' },
    { url: 'https://claude.com/blog', origin: 'post' },
  ],
  sharedPost: null,
  engagement: { likes: 10, comments: 2, shares: 0, views: null },
  comments: { status: 'FETCHED', items: [comment('c1', true, 'link nè'), comment('c2', false, 'hay')] },
  video: null,
} as RadarWorkItemDto;

describe('RadarAnalysisPrompt.parts', () => {
  const light = RadarAnalysisPrompt.parts(item, { depth: 'light', maxImages: 3, deepMinScore: 7 });
  const post = JSON.parse((light[1] as { text: string }).text);

  it('should send no Facebook URL anywhere and leave the permalink out (RAD-003)', () => {
    expect(JSON.stringify(light)).not.toMatch(/facebook\.com|fb\.watch|fbcdn\.net/);
    expect(post.links).toEqual([{ url: 'https://claude.com/blog', origin: 'post' }]);
  });

  it('should name only the post author among commenters', () => {
    expect(post.comments.items.map((c: { author: string | null }) => c.author)).toEqual(['Goon Nguyen', null]);
  });

  it('should send at most the pass image count, skipping blocked images, and mark which were sent', () => {
    const sent = light.filter((p) => 'fileUri' in p).map((p) => (p as { fileUri: string }).fileUri);

    expect(sent).toEqual([
      'https://res.cloudinary.com/demo/a.png',
      'https://res.cloudinary.com/demo/c.jpg',
      'https://res.cloudinary.com/demo/d.jpg',
    ]);
    expect(post.images.map((i: { sent: boolean }) => i.sent)).toEqual([true, false, true, true, false]);
  });

  it('should tell a light pass it has no research tools, and a deep pass its search limit', () => {
    const deep = RadarAnalysisPrompt.parts(item, { depth: 'deep', maxImages: 8, webSearch: true, maxSearchQueries: 2 });

    expect((light[0] as { text: string }).text).toMatch(/quick pass: no web search and no link reading/);
    expect((light[0] as { text: string }).text).toMatch(/score of 7 or more earns a full analysis/);
    expect((deep[0] as { text: string }).text).toMatch(/at most 2 queries/);
  });
});
