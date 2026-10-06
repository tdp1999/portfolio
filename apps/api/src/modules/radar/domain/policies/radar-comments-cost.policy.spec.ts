import { RadarCommentTierPolicy } from './radar-comment-tier.policy';
import { RadarCommentsCostPolicy } from './radar-comments-cost.policy';

describe('RadarCommentsCostPolicy.splitCap', () => {
  const worstCase = (tier: 'light' | 'full-flat', posts: number) =>
    RadarCommentsCostPolicy.worstCaseUsd(RadarCommentTierPolicy.input(tier), posts) +
    RadarCommentsCostPolicy.CHARGE_CAP_SLACK_USD;

  it('should give bounded tiers their worst case plus slack and the reply-heavy tier the rest', () => {
    const caps = RadarCommentsCostPolicy.splitCap(
      new Map([
        ['light', [1, 2, 3, 4]],
        ['full-flat', [1, 2]],
        ['full', [1]],
      ]),
      0.5
    );

    expect(caps.get('light')).toBeCloseTo(worstCase('light', 4), 3);
    expect(caps.get('full-flat')).toBeCloseTo(worstCase('full-flat', 2), 3);
    expect(caps.get('full')).toBeCloseTo(0.5 - worstCase('light', 4) - worstCase('full-flat', 2), 2);
  });

  it('should scale bounded tiers down to 80% of the cap when their worst case is larger', () => {
    const caps = RadarCommentsCostPolicy.splitCap(
      new Map([
        ['full-flat', Array.from({ length: 20 })],
        ['full', [1]],
      ]),
      0.5
    );

    expect(caps.get('full-flat')).toBeCloseTo(0.4, 2);
    // Rounded down to $0.001, so the split never adds up past the run's cap.
    expect(caps.get('full')).toBeCloseTo(0.1, 2);
    expect((caps.get('full-flat') ?? 0) + (caps.get('full') ?? 0)).toBeLessThanOrEqual(0.5);
  });
});

describe('RadarCommentsCostPolicy.reachedChargeCap', () => {
  const light = RadarCommentsCostPolicy.worstCaseUsd(RadarCommentTierPolicy.input('light'), 1);

  it('should never read a cap that covers the worst case as reached', () => {
    // A light job answering in full uses its whole budget, by design.
    expect(
      RadarCommentsCostPolicy.reachedChargeCap(5, light + RadarCommentsCostPolicy.CHARGE_CAP_SLACK_USD, light)
    ).toBe(false);
  });

  it('should read billing within the slack of the cap as reached', () => {
    // 40 comments bill $0.101; a $0.1 cap on a reply-heavy job was spent.
    expect(RadarCommentsCostPolicy.reachedChargeCap(40, 0.1)).toBe(true);
    expect(RadarCommentsCostPolicy.reachedChargeCap(10, 0.1)).toBe(false);
  });
});
