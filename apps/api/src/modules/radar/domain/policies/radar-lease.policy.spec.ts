import { RadarQueueFacts } from '../radar-item.types';
import { RadarLeasePolicy } from './radar-lease.policy';

const NOW = new Date('2026-10-06T10:00:00Z');
const LATER = new Date('2026-10-06T10:20:00Z');
const EARLIER = new Date('2026-10-06T09:59:59Z');
const CAP = RadarLeasePolicy.MAX_CLAIM_ATTEMPTS;

const item = (over: Partial<RadarQueueFacts>): RadarQueueFacts => ({
  workStatus: 'PENDING',
  sourceActive: true,
  leaseExpiresAt: null,
  claimCount: 0,
  ...over,
});

describe('RadarLeasePolicy.queueState', () => {
  // The order matters: it must match the Feed's status filter in the repository.
  it.each<[string, Partial<RadarQueueFacts>, string]>([
    ['done wins over a paused source', { workStatus: 'DONE', sourceActive: false }, 'analyzed'],
    [
      'paused wins over a live lease and the claim cap',
      { sourceActive: false, leaseExpiresAt: LATER, claimCount: CAP },
      'paused',
    ],
    ['a live lease is claimed, even at the claim cap', { leaseExpiresAt: LATER, claimCount: CAP }, 'claimed'],
    ['a lease expiring this instant still counts as claimed', { leaseExpiresAt: NOW }, 'claimed'],
    ['an expired lease at the claim cap is stuck', { leaseExpiresAt: EARLIER, claimCount: CAP }, 'stuck'],
    ['an expired lease under the cap waits again', { leaseExpiresAt: EARLIER, claimCount: CAP - 1 }, 'pending'],
    ['a never claimed item waits', {}, 'pending'],
  ])('%s', (_, over, state) => {
    expect(RadarLeasePolicy.queueState(item(over), NOW)).toBe(state);
  });
});
