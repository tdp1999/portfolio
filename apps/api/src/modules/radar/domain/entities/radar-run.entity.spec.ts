import { RadarRunFlow, RadarRunKind, RadarStatus, RadarStep } from '@prisma/client';

import { RADAR_RUN_CANCELLED_MESSAGE } from '@portfolio/shared/types';

import { radarRun, RUN_FIXTURE_SOURCE_ID } from '../__fixtures__/radar-run.fixture';
import { RadarDatasetCursor } from '../value-objects/radar-dataset-cursor';
import { RadarRun } from './radar-run.entity';

const NOW = new Date('2026-10-06T10:00:00Z');
const { PENDING, RUNNING, AWAITING_EXTERNAL, DONE, FAILED } = RadarStatus;
const adapters = { capture: 'apify', normalize: 'apify', enrich: 'storage', analyze: 'external-worker' };

/** A Manual run whose capture waits for the file. */
const waitingForUpload = () =>
  radarRun(
    { flow: RadarRunFlow.MANUAL, status: AWAITING_EXTERNAL },
    { [RadarStep.CAPTURE]: { status: AWAITING_EXTERNAL } }
  );

describe('RadarRun', () => {
  describe('create()', () => {
    it.each([
      [RadarRunFlow.HYBRID, PENDING],
      [RadarRunFlow.MANUAL, AWAITING_EXTERNAL],
    ])('should start a %s run and its capture as %s, on the four pipeline steps', (flow, waiting) => {
      const run = RadarRun.create({
        sourceId: RUN_FIXTURE_SOURCE_ID,
        sourceUrl: 'https://www.facebook.com/page',
        sourceName: 'page',
        flow,
        windowFrom: null,
        windowTo: null,
        itemCap: 300,
        fetchComments: false,
        budgetMicroUsd: null,
        deepAnalysis: false,
        adapters,
      });

      expect(run.status).toBe(waiting);
      expect(run.steps.map((s) => [s.step, s.status])).toEqual([
        [RadarStep.CAPTURE, waiting],
        [RadarStep.NORMALIZE, PENDING],
        [RadarStep.ENRICH, PENDING],
        [RadarStep.ANALYZE, PENDING],
      ]);
    });

    it('should refuse a capture run with no source', () => {
      expect(() =>
        RadarRun.create({
          sourceId: '',
          sourceUrl: '',
          sourceName: '',
          flow: RadarRunFlow.HYBRID,
          windowFrom: null,
          windowTo: null,
          itemCap: 300,
          fetchComments: false,
          budgetMicroUsd: null,
          deepAnalysis: false,
          adapters,
        })
      ).toThrow();
    });
  });

  describe('reanalyze()', () => {
    it('should start an Auto run with no source and only the ANALYZE step, capped at the item count', () => {
      const run = RadarRun.reanalyze({
        itemCount: 7,
        budgetMicroUsd: 500_000,
        deepAnalysis: false,
        analyzeAdapter: 'gemini',
      });

      expect(run.kind).toBe(RadarRunKind.REANALYZE);
      expect(run.sourceId).toBeNull();
      expect(run.flow).toBe(RadarRunFlow.AUTO);
      expect(run.itemCap).toBe(7);
      expect(run.budgetMicroUsd).toBe(500_000);
      expect(run.steps.map((s) => [s.step, s.status, s.adapter])).toEqual([[RadarStep.ANALYZE, PENDING, 'gemini']]);
    });
  });

  describe('startCapture()', () => {
    it('should record the input sent to the provider on CAPTURE, and keep it when the capture completes', () => {
      const input = { startUrls: [{ url: 'https://www.facebook.com/page' }], resultsLimit: 300 };

      const started = radarRun({ status: RUNNING }).startCapture('job-1', input, NOW);
      const completed = started.completeCapture(RadarDatasetCursor.start('ds', 3), NOW);

      expect(started.step(RadarStep.CAPTURE).captureInput).toEqual(input);
      expect(completed.step(RadarStep.CAPTURE).captureInput).toEqual(input);
    });
  });

  describe('cancel()', () => {
    it.each([
      [
        'a run in NORMALIZE',
        radarRun({}, { [RadarStep.CAPTURE]: { status: DONE }, [RadarStep.NORMALIZE]: { status: RUNNING } }),
        RadarStep.NORMALIZE,
      ],
      ['a Manual run waiting for its upload', waitingForUpload(), RadarStep.CAPTURE],
    ])('should fail the step %s is on, and the run, with the cancel message', (_, run, step) => {
      const cancelled = run.cancel(NOW);

      expect(cancelled.status).toBe(FAILED);
      expect(cancelled.error).toBe(RADAR_RUN_CANCELLED_MESSAGE);
      expect(cancelled.step(step)).toMatchObject({ status: FAILED, error: RADAR_RUN_CANCELLED_MESSAGE });
    });

    it.each([DONE, FAILED])('should refuse a %s run', (status) => {
      expect(() => radarRun({ status }).cancel(NOW)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_RUN_FINISHED' })
      );
    });
  });

  describe('ensureAwaitsUploadFor()', () => {
    it('should accept the Manual run of this source whose capture waits for the file', () => {
      expect(() => waitingForUpload().ensureAwaitsUploadFor(RUN_FIXTURE_SOURCE_ID)).not.toThrow();
    });

    it.each([
      ['another source', waitingForUpload(), 'other-source'],
      [
        'a Hybrid run',
        radarRun({ flow: RadarRunFlow.HYBRID }, { [RadarStep.CAPTURE]: { status: AWAITING_EXTERNAL } }),
        RUN_FIXTURE_SOURCE_ID,
      ],
      [
        'a capture already done',
        radarRun({ flow: RadarRunFlow.MANUAL }, { [RadarStep.CAPTURE]: { status: DONE } }),
        RUN_FIXTURE_SOURCE_ID,
      ],
    ])('should refuse %s', (_, run, sourceId) => {
      expect(() => run.ensureAwaitsUploadFor(sourceId)).toThrow(
        expect.objectContaining({ errorCode: 'RADAR_RUN_NOT_AWAITING_UPLOAD' })
      );
    });
  });
});
