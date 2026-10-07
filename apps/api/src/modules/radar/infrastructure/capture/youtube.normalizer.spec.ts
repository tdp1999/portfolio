import { YouTubeNormalizer } from './youtube.normalizer';

/** A `videos.list` resource with only the parts a test needs to change. */
const video = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  snippet: {
    publishedAt: '2026-10-06T08:00:00Z',
    title: 'Claude Code tips',
    description: '',
    channelId: 'UCabcdefghijklmnopqrstuv',
    channelTitle: 'Some Channel',
    liveBroadcastContent: 'none',
    ...(over['snippet'] as object),
  },
  contentDetails: { duration: 'PT10M', ...(over['contentDetails'] as object) },
  status: { privacyStatus: 'public', ...(over['status'] as object) },
});

const normalize = (raw: unknown[]) => new YouTubeNormalizer().normalize(raw);

describe('YouTubeNormalizer', () => {
  it('should keep only public videos that have aired, once each, and count the rest as skipped', () => {
    const result = normalize([
      video('pub'),
      video('pub'),
      video('priv', { status: { privacyStatus: 'private' } }),
      video('unl', { status: { privacyStatus: 'unlisted' } }),
      video('soon', { snippet: { liveBroadcastContent: 'upcoming' } }),
      video('live', { snippet: { liveBroadcastContent: 'live' } }),
    ]);

    expect(result.items.map((i) => i.externalId)).toEqual(['pub']);
    expect(result.skipped).toBe(5);
    expect(result.failures).toEqual([]);
  });

  it('should read an ISO 8601 duration in seconds and leave a zero duration unknown', () => {
    const result = normalize([
      video('long', { contentDetails: { duration: 'PT1H2M3S' } }),
      video('day', { contentDetails: { duration: 'P1DT1S' } }),
      video('zero', { contentDetails: { duration: 'P0D' } }),
      video('bad', { contentDetails: { duration: '62 minutes' } }),
    ]);

    expect(result.items.map((i) => i.video?.durationSec)).toEqual([3_723, 86_401, null, null]);
  });

  it('should take up to ten description links, without trailing punctuation or the video itself', () => {
    const own = 'https://www.youtube.com/watch?v=vid1';
    const many = Array.from({ length: 12 }, (_, n) => `https://site${n}.test/p`).join('\n');
    const description = `Read https://docs.test/guide. Also (https://repo.test/x), again https://docs.test/guide and ${own}\n${many}`;

    const [item] = normalize([video('vid1', { snippet: { description } })]).items;

    expect(item.links).toHaveLength(10);
    expect(item.links.slice(0, 3).map((l) => l.url)).toEqual([
      'https://docs.test/guide',
      'https://repo.test/x',
      'https://site0.test/p',
    ]);
  });

  it('should store the largest thumbnail as the one photo, keyed to the video', () => {
    const thumbnails = {
      default: { url: 'https://i.ytimg.com/vi/v/default.jpg', width: 120, height: 90 },
      high: { url: 'https://i.ytimg.com/vi/v/hq.jpg', width: 480, height: 360 },
      standard: { url: 'not a url' },
    };

    const [item] = normalize([video('v', { snippet: { thumbnails } })]).items;

    expect(item.media).toEqual([
      expect.objectContaining({
        type: 'photo',
        url: 'https://i.ytimg.com/vi/v/hq.jpg',
        width: 480,
        externalId: 'v:thumbnail',
        storageStatus: 'pending',
      }),
    ]);
  });
});
