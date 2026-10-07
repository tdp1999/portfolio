import { readFileSync } from 'fs';
import { join } from 'path';

import { RadarItemKind } from '@prisma/client';

import { ApifyFacebookNormalizer } from './apify-facebook.normalizer';

interface Post extends Record<string, unknown> {
  postId: string;
  url: string;
  time: string;
  text: string;
  likes: number;
  comments: number;
  shares: number;
  user: { id: string; name: string };
  sharedPost?: { url: string };
}

const fixture: Post[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__/apify-posts.sample.json'), 'utf8'));
const byId = (postId: string) => fixture.find((p) => p.postId === postId) as Post;

const ALBUM_POST = '10239085569570213'; // 3 photos + mediaset wrapper, install.sh link
const REEL_POST = '10239149639371918';
const SHARE_POST = '10239154688658147'; // shared post, promo `link`
const PLAIN_POST = '10239125080757968'; // no link, only a null-ish media slot

describe('ApifyFacebookNormalizer', () => {
  const normalizer = new ApifyFacebookNormalizer();

  it('should map an album post and keep its text verbatim apart from trimming', () => {
    const raw = byId(ALBUM_POST);
    const padded = { ...raw, text: `\n  ${raw.text}  \n` };

    const [item] = normalizer.normalize([padded]).items;

    expect(item).toMatchObject({
      externalId: ALBUM_POST,
      provider: 'apify-facebook-posts',
      kind: RadarItemKind.POST,
      permalink: raw.url,
      authorName: raw.user.name,
      authorExternalId: raw.user.id,
      publishedAt: new Date(raw.time),
      text: raw.text.trim(),
      links: [{ url: 'https://agentkit.best/install.sh', origin: 'post' }],
      engagement: { likes: raw.likes, comments: raw.comments, shares: raw.shares, views: null },
    });
  });

  it('should keep only photo and video media, dropping the album wrapper', () => {
    const { items } = normalizer.normalize([byId(ALBUM_POST), byId(PLAIN_POST)]);

    expect(items[0].media).toHaveLength(3);
    expect(items[0].media.every((m) => m.type === 'photo' && m.url.startsWith('https://'))).toBe(true);
    expect(items[0].media[0].ocrText).toContain('May be an image of text');
    expect(items[1].media).toEqual([]);
  });

  it('should classify reel, video, share and plain post kinds', () => {
    const plainVideo = { ...byId(PLAIN_POST), postId: 'video-1', isVideo: true };

    const kinds = normalizer
      .normalize([byId(REEL_POST), plainVideo, byId(SHARE_POST), byId(PLAIN_POST)])
      .items.map((i) => i.kind);

    expect(kinds).toEqual([RadarItemKind.REEL, RadarItemKind.VIDEO, RadarItemKind.SHARE, RadarItemKind.POST]);
  });

  it('should keep the raw payload unchanged and drop the subscribe-now promo link', () => {
    const raw = byId(SHARE_POST);

    const [item] = normalizer.normalize([raw]).items;

    expect(item.rawPayload).toEqual(byId(SHARE_POST));
    expect(item.links).toEqual([{ url: raw.sharedPost?.url, origin: 'shared-post' }]);
  });

  it('should read shared-post media from `attachments` when the actor puts it there', () => {
    const photo = { __typename: 'Photo', id: 'p1', image: { uri: 'https://scontent.xx.fbcdn.net/p1.jpg' } };
    const video = { __typename: 'Video', id: 'v1', image: { uri: 'https://scontent.xx.fbcdn.net/v1.jpg' } };
    const share = {
      ...byId(PLAIN_POST),
      postId: 'share-att',
      sharedPost: {
        url: 'https://www.facebook.com/groups/x/posts/1/',
        // The same photo in both lists is kept once.
        media: [photo],
        attachments: [{ mediaset_token: 'pcb.1' }, photo, video],
      },
    };

    const [item] = normalizer.normalize([share]).items;

    expect(item.media).toEqual([]);
    expect(item.sharedPost?.media.map((m) => [m.type, m.externalId])).toEqual([
      ['photo', 'p1'],
      ['video', 'v1'],
    ]);
  });

  it('should rewrite ISP-embedded CDN hosts to the public Facebook CDN host', () => {
    const edge = 'https://scontent.fosu2-2.fna.fbcdn.net/v/t39.99422-6/a.jpg?oh=1&oe=2';
    const post = {
      ...byId(PLAIN_POST),
      postId: 'edge-host',
      media: [{ __typename: 'Photo', id: 'e1', thumbnail: edge, image: { uri: edge } }],
    };

    const [item] = normalizer.normalize([post]).items;

    expect(item.media[0].url).toBe('https://scontent.xx.fbcdn.net/v/t39.99422-6/a.jpg?oh=1&oe=2');
    expect(item.media[0].thumbnailUrl).toBe(item.media[0].url);
  });

  it('should read the video file and its length from the media list, falling back to HD without SD', () => {
    const hd = 'https://video.fosu2-1.fna.fbcdn.net/o1/v/t2/r.mp4?oh=1';
    const post = {
      ...byId(PLAIN_POST),
      postId: 'reel-video',
      media: [
        {
          __typename: 'Video',
          id: 'v1',
          playable_duration_in_ms: 61_200,
          videoDeliveryLegacyFields: { browser_native_hd_url: hd },
        },
      ],
    };

    const [item] = normalizer.normalize([post]).items;

    expect(item.video).toEqual({ url: 'https://video.xx.fbcdn.net/o1/v/t2/r.mp4?oh=1', durationSec: 62 });
  });

  it('should drop hashtag links and attribute a link copied from the shared post to it', () => {
    const external = 'https://example.com/article';
    const hashtag = 'https://www.facebook.com/hashtag/buildinpublic?__cft__=x';
    const sharedUrl = 'https://www.facebook.com/groups/x/posts/1/';
    const copied = {
      ...byId(PLAIN_POST),
      postId: 'copied',
      link: external,
      sharedPost: { url: sharedUrl, link: external },
    };
    const tagged = { ...byId(PLAIN_POST), postId: 'tagged', link: hashtag };

    const [a, b] = normalizer.normalize([copied, tagged]).items;

    expect(a.links).toEqual([
      { url: external, origin: 'shared-post' },
      { url: sharedUrl, origin: 'shared-post' },
    ]);
    expect(b.links).toEqual([]);
  });

  it("should read the actor's empty-result row as a notice, not a failed post", () => {
    const row = {
      inputUrl: 'https://www.facebook.com/mrgoonie',
      error: 'no_items',
      errorDescription: 'Empty or private data for provided input',
    };

    const result = normalizer.normalize([row]);

    expect(result).toMatchObject({ items: [], failures: [] });
    expect(result.notices).toEqual([
      'Apify found no posts for this source and window: Empty or private data for provided input',
    ]);
  });

  it('should report a malformed post as a failure and still normalize the rest', () => {
    const { postId: _omit, ...malformed } = byId(PLAIN_POST);

    const result = normalizer.normalize([byId(ALBUM_POST), malformed, byId(REEL_POST)]);

    expect(result.items.map((i) => i.externalId)).toEqual([ALBUM_POST, REEL_POST]);
    expect(result.failures).toEqual([{ index: 1, reason: expect.stringContaining('postId') }]);
  });

  it('should keep the first copy of a post repeated in the same batch and count the rest as skipped', () => {
    const result = normalizer.normalize(fixture.concat(byId(ALBUM_POST)));

    expect(result.items).toHaveLength(fixture.length);
    expect(result.skipped).toBe(1);
  });
});
