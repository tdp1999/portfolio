import { defaultWindowFrom, formatDuration, runNotice, runStepRows, stepSummary } from './radar-run.util';
import type { RadarRun, RadarRunStatus, RadarStepRun } from './radar.types';

const SOURCE = 'src-1';
const NOW = new Date('2026-10-05T08:00:00Z');

const steps = (statuses: RadarRunStatus[], error: string | null = null): RadarStepRun[] =>
  (['CAPTURE', 'NORMALIZE', 'ENRICH', 'ANALYZE'] as const).map((step, i) => ({
    step,
    status: statuses[i],
    adapter: 'x',
    error: statuses[i] === 'FAILED' ? error : null,
    startedAt: null,
    finishedAt: null,
  }));

const run = (over: Partial<RadarRun>): RadarRun =>
  ({
    source: { id: SOURCE, displayName: 'S' },
    flow: 'HYBRID',
    status: 'DONE',
    windowFrom: null,
    windowTo: null,
    createdAt: '2026-09-01T00:00:00Z',
    error: null,
    steps: steps(['DONE', 'DONE', 'DONE', 'DONE']),
    ...over,
  }) as RadarRun;

const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe('defaultWindowFrom', () => {
  it('should chain from the day after the newest successful run of the same source, or the day it ran', () => {
    const runs = [
      run({ status: 'FAILED', createdAt: '2026-10-01T00:00:00Z' }),
      run({ source: { id: 'other', displayName: 'O' }, createdAt: '2026-09-30T00:00:00Z' }),
      run({ windowTo: '2026-09-20T23:59:59.999Z', createdAt: '2026-09-25T00:00:00Z' }),
      run({ createdAt: '2026-09-10T12:00:00Z' }),
    ];

    expect(ymd(defaultWindowFrom(runs, SOURCE, NOW))).toEqual([2026, 9, 21]);
    expect(ymd(defaultWindowFrom([runs[3]], SOURCE, NOW))).toEqual([2026, 9, 10]);
  });

  it('should not start after today when the last run ended today', () => {
    const last = run({ windowTo: '2026-10-05T23:59:59.999Z' });

    expect(ymd(defaultWindowFrom([last], SOURCE, NOW))).toEqual(ymd(NOW));
  });

  it('should start six months back when the source has no successful run', () => {
    const from = defaultWindowFrom([run({ status: 'FAILED' })], SOURCE, NOW);

    expect(from.getMonth()).toBe(3);
    expect(from.getFullYear()).toBe(2026);
  });
});

describe('runNotice', () => {
  it('should name the failed step with its provider message, ask for the upload or for /radar work, and stay silent otherwise', () => {
    const failed = run({
      status: 'FAILED',
      steps: steps(['FAILED', 'PENDING', 'PENDING', 'PENDING'], 'Apify run TIMED-OUT'),
    });
    const upload = run({
      flow: 'MANUAL',
      status: 'AWAITING_EXTERNAL',
      steps: steps(['AWAITING_EXTERNAL', 'PENDING', 'PENDING', 'PENDING']),
    });
    const work = run({ status: 'AWAITING_EXTERNAL', steps: steps(['DONE', 'DONE', 'DONE', 'AWAITING_EXTERNAL']) });
    const running = run({ status: 'RUNNING', steps: steps(['DONE', 'RUNNING', 'PENDING', 'PENDING']) });

    expect(runNotice(failed)).toEqual({ kind: 'failed', title: 'Capture failed', message: 'Apify run TIMED-OUT' });
    expect(runNotice(upload)).toEqual({ kind: 'awaiting-upload' });
    expect(runNotice(work)).toEqual({ kind: 'awaiting-work' });
    expect(runNotice(running)).toBeNull();
    expect(runNotice({ ...failed, error: 'Cancelled by the Owner' })).toEqual({
      kind: 'cancelled',
      title: 'Cancelled at Capture',
    });
  });
});

describe('stepSummary', () => {
  it('should name the first unfinished step, or say all done, or flag a stepless direct upload', () => {
    expect(
      stepSummary(run({ status: 'AWAITING_EXTERNAL', steps: steps(['DONE', 'DONE', 'DONE', 'AWAITING_EXTERNAL']) }))
    ).toBe('Analyze: waiting');
    expect(stepSummary(run({}))).toBe('All steps done');
    expect(stepSummary(run({ steps: [] }))).toBe('Direct upload, no steps');
  });
});

describe('runStepRows', () => {
  it('should time a finished step and read a step a failed run never got to as not reached', () => {
    const failed = steps(['DONE', 'FAILED', 'PENDING', 'PENDING'], 'boom');
    failed[0] = { ...failed[0], startedAt: '2026-10-05T10:00:00Z', finishedAt: '2026-10-05T10:01:12Z' };

    const rows = runStepRows(run({ status: 'FAILED', steps: failed }));

    expect(rows.map((r) => [r.statusLabel, r.duration])).toEqual([
      ['Done', '1 min 12 s'],
      ['Failed', null],
      ['Not reached', null],
      ['Not reached', null],
    ]);
  });
});

describe('formatDuration', () => {
  it.each([
    [400, 'under 1 s'],
    [8_000, '8 s'],
    [120_000, '2 min'],
    [7_500_000, '2 h 5 min'],
  ])('should read %i ms as "%s"', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
