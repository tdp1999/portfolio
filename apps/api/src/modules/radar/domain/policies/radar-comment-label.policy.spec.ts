import { RadarCommentDraft } from '../radar-comment.types';
import { RadarCommentLabelPolicy } from './radar-comment-label.policy';

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

describe('RadarCommentLabelPolicy.label', () => {
  it('should label as spam a text several people pasted, a shady link, and an "ib" call', () => {
    const labels = RadarCommentLabelPolicy.label([
      draft({ text: 'Cho mình xin tài liệu với ạ', profileId: 'a' }),
      draft({ text: 'cho mình xin tài liệu với ạ!', profileId: 'b' }),
      draft({ text: 'Khoá học giá tốt đây', links: ['https://bit.ly/abc'] }),
      draft({ text: 'Bạn check ib mình nha' }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['spam', 'spam', 'spam', 'spam']);
  });

  it('should not count the same person repeating themselves, or the author, as copy-paste', () => {
    const labels = RadarCommentLabelPolicy.label([
      draft({ text: 'Bản này chạy chậm trên máy mình', profileId: 'a' }),
      draft({ text: 'Bản này chạy chậm trên máy mình', profileId: 'a' }),
      draft({ text: 'Link repo đây github', isAuthor: true, profileId: 'author' }),
      draft({ text: 'Link repo đây github', isAuthor: true, profileId: 'author' }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['substantive', 'substantive', 'author', 'author']);
  });

  it('should label filler as low, unless an image carries text', () => {
    const labels = RadarCommentLabelPolicy.label([
      draft({ text: 'hóng' }),
      draft({ text: '🔥🔥' }),
      draft({ text: '', images: [{ url: 'https://x/1.jpg', ocrText: null }] }),
      draft({ text: '', images: [{ url: 'https://x/2.jpg', ocrText: 'npm i claude-tool' }] }),
    ]).map((c) => c.label);

    expect(labels).toEqual(['low', 'low', 'low', 'substantive']);
  });
});
