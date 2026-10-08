import { isReanalysisQueued } from './radar-item.util';
import type { RadarItemDetail } from './radar.types';

const item = (over: Partial<RadarItemDetail>) =>
  ({ enrichment: {}, workStatus: 'PENDING', queueState: 'pending', ...over }) as RadarItemDetail;

describe('isReanalysisQueued', () => {
  it.each([
    ['an analyzed post back in the queue', item({}), true],
    ['an analyzed post a worker holds right now', item({ workStatus: 'CLAIMED', queueState: 'claimed' }), true],
    ['a re-analysis that ran out of retries (stuck)', item({ queueState: 'stuck' }), false],
    ['a post analyzed and done', item({ workStatus: 'DONE', queueState: 'analyzed' }), false],
    ['a post never analyzed', item({ enrichment: null }), false],
  ])('should treat %s as %s', (_, it, queued) => {
    expect(isReanalysisQueued(it)).toBe(queued);
  });
});
