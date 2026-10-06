import { readFileSync } from 'fs';
import { join } from 'path';

import { normalizeApifyComments } from './apify-comments.normalizer';

const POST_A =
  'https://www.facebook.com/mrgoonie/posts/pfbid0aX8dsYWeNSb3NmpUnKSR6jrgUMYBFmeqgbLcDLSEqsfdHPaUXbaxKvWp2oRoHH64l';
const POST_B =
  'https://www.facebook.com/mrgoonie/posts/pfbid0G1GakiCjiCoLjBc6odwpBUVHmRRPaxCZvbgDw1voxnnYf8Yhftj55GmKLEXRiD8Fl';
const AUTHOR_ID = '1010276030';

const raw: unknown[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__/apify-comments.sample.json'), 'utf8'));
const commentsOf = (url: string) => raw.filter((c) => (c as { inputUrl: string }).inputUrl === url);
const topLevelIn = (url: string) =>
  commentsOf(url).filter((c) => (c as { threadingDepth: number }).threadingDepth === 0).length;

describe('normalizeApifyComments', () => {
  it('should group by post, match a permalink with tracking params and trailing slash, and count what came back', () => {
    const result = normalizeApifyComments(raw, [
      { permalink: `${POST_A}/?__cft__=x`, authorExternalId: AUTHOR_ID },
      { permalink: POST_B, authorExternalId: AUTHOR_ID },
    ]);

    expect([...result.byPermalink.keys()]).toEqual([`${POST_A}/?__cft__=x`, POST_B]);
    expect(result.received.get(POST_B)).toEqual({ topLevel: topLevelIn(POST_B), total: commentsOf(POST_B).length });
    // The third post of the file is not a target.
    expect(result.unmatched).toBe(12);
    expect(result.failures).toEqual([]);
  });

  it('should mark only the post author, keep names only for them, and drop the subscribe-now promo link', () => {
    const all = [
      ...normalizeApifyComments(raw, [
        { permalink: POST_A, authorExternalId: AUTHOR_ID },
        { permalink: POST_B, authorExternalId: AUTHOR_ID },
      ]).byPermalink.values(),
    ].flat();

    expect(all.some((c) => c.isAuthor)).toBe(true);
    expect(all.filter((c) => !c.isAuthor).every((c) => c.authorName === null)).toBe(true);
    expect(all.filter((c) => c.isAuthor).every((c) => c.label === 'author' && c.authorName)).toBe(true);
    expect(all.flatMap((c) => c.links).some((l) => l.includes('subscribenow'))).toBe(false);
  });

  it('should keep posts apart when only their id params differ', () => {
    const story = (id: string) => `https://www.facebook.com/permalink.php?story_fbid=${id}&id=42`;
    const comment = (id: string, post: string) => ({ id, inputUrl: `${post}&__tn__=R`, text: 'ok' });

    const result = normalizeApifyComments(
      [comment('c1', story('1')), comment('c2', story('2'))],
      [
        { permalink: story('1'), authorExternalId: null },
        { permalink: story('2'), authorExternalId: null },
      ]
    );

    expect(result.byPermalink.get(story('1'))?.map((c) => c.id)).toEqual(['c1']);
    expect(result.byPermalink.get(story('2'))?.map((c) => c.id)).toEqual(['c2']);
  });

  it('should skip a repeated comment id and report an entry with no id as a failure', () => {
    const [first] = raw as { id: string }[];

    const result = normalizeApifyComments(
      [first, first, { text: 'no id' }],
      [
        { permalink: POST_A, authorExternalId: AUTHOR_ID },
        { permalink: POST_B, authorExternalId: AUTHOR_ID },
        {
          permalink:
            'https://www.facebook.com/mrgoonie/posts/pfbid032ee71yi5m6gxbQWJB8uGa9fcxroPV3bBkeTHUYJv97SDvEtREyn6axn2djh7b8MLl',
          authorExternalId: AUTHOR_ID,
        },
      ]
    );

    expect([...result.byPermalink.values()].flat()).toHaveLength(1);
    expect(result.failures.map((f) => f.index)).toEqual([2]);
  });
});
