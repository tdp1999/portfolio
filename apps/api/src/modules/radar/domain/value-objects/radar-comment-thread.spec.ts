import { RadarComment, RadarCommentDraft } from '../radar-comment.types';
import { RadarCommentThread } from './radar-comment-thread';

let seq = 0;
const draft = (over: Partial<RadarCommentDraft>): RadarCommentDraft => ({
  id: `c${++seq}`,
  parentId: null,
  depth: 0,
  isAuthor: false,
  authorName: null,
  text: 'Mình dùng bản này thấy tốn token hơn bản cũ',
  publishedAt: null,
  likes: 0,
  replies: 0,
  links: [],
  images: [],
  profileId: `p${seq}`,
  ...over,
});

const comment = (over: Partial<RadarComment>): RadarComment => {
  const { profileId: _, ...rest } = draft({});
  return { ...rest, label: 'substantive', ...over };
};

describe('RadarCommentThread', () => {
  it('should keep every author comment and the best others by label then likes + replies, in thread order', () => {
    const author = draft({ id: 'author', isAuthor: true, text: 'Link repo đây github' });
    const spam = draft({ id: 'spam', text: 'Bạn check ib mình nha', likes: 999 });
    const low = draft({ id: 'low', text: 'hóng', likes: 500 });
    const others = Array.from({ length: RadarCommentThread.MAX_STORED_OTHERS }, (_, i) =>
      draft({ id: `s${i}`, text: `Góp ý số ${i}: bản này tốn token hơn`, likes: i === 0 ? 0 : 10 })
    );
    const ids = (thread: RadarCommentThread) => thread.comments.map((c) => c.id);

    // 50 substantive fill the quota: the low-liked one still beats filler and spam by label.
    expect(ids(RadarCommentThread.fromDrafts([spam, author, ...others, low]))).toEqual([
      'author',
      ...others.map((c) => c.id),
    ]);

    const fewer = others.slice(0, 49);
    expect(ids(RadarCommentThread.fromDrafts([spam, author, low, ...fewer]))).toEqual([
      'author',
      'low',
      ...fewer.map((c) => c.id),
    ]);
  });

  it('should send only author and substantive comments to the worker, cutting non-author text', () => {
    const long = 'x'.repeat(RadarCommentThread.MAX_CLAIM_TEXT + 100);

    const claim = RadarCommentThread.stored([
      comment({ id: 'a', isAuthor: true, label: 'author', text: long }),
      comment({ id: 's', text: long }),
      comment({ id: 'l', label: 'low' }),
      comment({ id: 'p', label: 'spam' }),
    ]).forClaim();

    expect(claim.map((c) => [c.id, c.text.length])).toEqual([
      ['a', long.length],
      ['s', RadarCommentThread.MAX_CLAIM_TEXT],
    ]);
  });

  describe('fetchStatus()', () => {
    const replies = (n: number) => Array.from({ length: n }, () => comment({ depth: 1 }));
    const topLevel = (n: number) => Array.from({ length: n }, () => comment({ depth: 0 }));

    it.each<[string, RadarComment[], boolean, 'FETCHED' | 'PARTIAL']>([
      ['cap hit and fewer than asked and counted', topLevel(2), true, 'PARTIAL'],
      ['cap hit but replies make up the count', [...topLevel(10), ...replies(20)], true, 'FETCHED'],
      ['no cap hit', topLevel(2), false, 'FETCHED'],
    ])('%s -> %s', (_, comments, capHit, status) => {
      const thread = RadarCommentThread.stored(comments);

      expect(thread.fetchStatus({ capHit, resultsLimit: 15 }, 30)).toBe(status);
    });
  });
});
