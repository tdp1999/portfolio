import {
  commentsForClaim,
  keepComments,
  labelComments,
  MAX_CLAIM_COMMENT_TEXT,
  MAX_STORED_OTHER_COMMENTS,
  RadarComment,
  RadarCommentDraft,
  RadarCommentPost,
  selectCommentTier,
} from './radar-comments';

const LONG_CAPTION =
  'Mình tổng hợp lại cách dùng Claude Code với MCP cho dự án frontend, có so sánh vài setup khác nhau.';

const post = (over: Partial<RadarCommentPost>): RadarCommentPost => ({
  text: LONG_CAPTION,
  commentCount: 30,
  hasLinks: false,
  hasMedia: false,
  ...over,
});

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

describe('selectCommentTier', () => {
  it.each<[string, Partial<RadarCommentPost>, string]>([
    ['under 3 comments', { commentCount: 2, text: 'link dưới còm 👇' }, 'skip'],
    ['giveaway bait, however many comments', { commentCount: 400, text: 'Comment "ok" để nhận file prompt' }, 'light'],
    ['meme: media, no link, no pointer, short caption', { hasMedia: true, text: 'Dev năm 2026 #ai #meme' }, 'skip'],
    ['quiet post that points to its comments', { commentCount: 5, text: 'Link repo dưới còm nha' }, 'light'],
    ['quiet post that does not point to comments', { commentCount: 10 }, 'skip'],
    ['discussion from 20 comments', { commentCount: 20 }, 'full'],
    ['100+ comments drop replies', { commentCount: 100 }, 'full-flat'],
  ])('%s', (_, over, tier) => {
    expect(selectCommentTier(post(over))).toBe(tier);
  });
});

describe('labelComments', () => {
  it('should label as spam a text several people pasted, a shady link, and an "ib" call', () => {
    const labels = labelComments([
      draft({ text: 'Cho mình xin tài liệu với ạ', profileId: 'a' }),
      draft({ text: 'cho mình xin tài liệu với ạ!', profileId: 'b' }),
      draft({ text: 'Khoá học giá tốt đây', links: ['https://bit.ly/abc'] }),
      draft({ text: 'Bạn check ib mình nha' }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['spam', 'spam', 'spam', 'spam']);
  });

  it('should not count the same person repeating themselves, or the author, as copy-paste', () => {
    const labels = labelComments([
      draft({ text: 'Bản này chạy chậm trên máy mình', profileId: 'a' }),
      draft({ text: 'Bản này chạy chậm trên máy mình', profileId: 'a' }),
      draft({ text: 'Link repo đây github', isAuthor: true, profileId: 'author' }),
      draft({ text: 'Link repo đây github', isAuthor: true, profileId: 'author' }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['substantive', 'substantive', 'author', 'author']);
  });

  it('should label filler as low, unless an image carries text', () => {
    const labels = labelComments([
      draft({ text: 'hóng' }),
      draft({ text: '🔥🔥' }),
      draft({ text: '', images: [{ url: 'https://x/1.jpg', ocrText: null }] }),
      draft({ text: '', images: [{ url: 'https://x/2.jpg', ocrText: 'npm i claude-tool' }] }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['low', 'low', 'low', 'substantive']);
  });
});

describe('keepComments', () => {
  it('should keep every author comment and the best others by label then likes + replies, in thread order', () => {
    const author = comment({ id: 'author', isAuthor: true, label: 'author' });
    const spam = comment({ id: 'spam', label: 'spam', likes: 999 });
    const low = comment({ id: 'low', label: 'low', likes: 500 });
    const others = Array.from({ length: MAX_STORED_OTHER_COMMENTS }, (_, i) =>
      comment({ id: `s${i}`, likes: i === 0 ? 0 : 10 })
    );

    const kept = keepComments([spam, author, ...others, low]).map((c) => c.id);

    // 50 substantive fill the quota: the low-liked one still beats filler and spam by label.
    expect(kept).toEqual(['author', ...others.map((c) => c.id)]);

    const fewer = keepComments([spam, author, low, ...others.slice(0, 49)]).map((c) => c.id);
    expect(fewer).toEqual(['author', 'low', ...others.slice(0, 49).map((c) => c.id)]);
  });
});

describe('commentsForClaim', () => {
  it('should send only author and substantive comments, cutting non-author text', () => {
    const long = 'x'.repeat(MAX_CLAIM_COMMENT_TEXT + 100);

    const claim = commentsForClaim([
      comment({ id: 'a', isAuthor: true, label: 'author', text: long }),
      comment({ id: 's', text: long }),
      comment({ id: 'l', label: 'low' }),
      comment({ id: 'p', label: 'spam' }),
    ]);

    expect(claim.map((c) => [c.id, c.text.length])).toEqual([
      ['a', long.length],
      ['s', MAX_CLAIM_COMMENT_TEXT],
    ]);
  });
});
