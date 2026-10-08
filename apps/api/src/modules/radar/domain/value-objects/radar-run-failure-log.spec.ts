import { RadarRunFailureLog } from './radar-run-failure-log';

const failures = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ index: from + i, ref: `post-${from + i}`, reason: 'time: Invalid' }));

describe('RadarRunFailureLog', () => {
  it('should keep the first 20 failures across pages and only count the rest', () => {
    const log = RadarRunFailureLog.fromMeta({}).add(failures(15)).add(failures(10, 15));

    expect(log.failures).toHaveLength(RadarRunFailureLog.MAX_KEPT);
    expect(log.failures.at(-1)?.ref).toBe('post-19');
    expect(log.dropped).toBe(5);
    expect(RadarRunFailureLog.fromMeta(log.toMeta()).add(failures(1, 25)).dropped).toBe(6);
  });

  it('should trim a long reason to 300 characters and store a missing ref as null', () => {
    const log = RadarRunFailureLog.fromMeta({}).add([{ index: 0, reason: 'x'.repeat(500) }]);

    expect(log.failures).toEqual([{ ref: null, reason: 'x'.repeat(RadarRunFailureLog.MAX_REASON) }]);
  });
});
