import { RadarCommentsProgress } from './radar-comments-progress';

const NOW = new Date('2026-10-06T10:00:00Z');
const job = (tier: 'light' | 'full') => ({ tier, itemIds: ['item-1'], maxChargeUsd: 0.5 });

describe('RadarCommentsProgress', () => {
  it('should be done at once when there is no job to run', () => {
    expect(RadarCommentsProgress.plan([], NOW).done).toBe(true);
  });

  it('should settle only once every job is settled', () => {
    const progress = RadarCommentsProgress.plan([job('light'), job('full')], NOW).withJobSettled(0);

    expect(progress.settle().done).toBe(false);
    expect(progress.withJobSettled(1).settle().done).toBe(true);
  });
});
