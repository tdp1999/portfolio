import { RadarStatus, RadarStep } from '@prisma/client';

import { RadarStepRun } from './radar-step-run.entity';

const NOW = new Date('2026-10-06T10:00:00Z');

describe('RadarStepRun', () => {
  it('should count a retried error with a cut message, and clear the error once the step finishes', () => {
    const step = RadarStepRun.create(RadarStep.NORMALIZE, RadarStatus.RUNNING, 'apify');

    const retried = step.countError('x'.repeat(RadarStepRun.MAX_ERROR + 10)).countError('socket hang up');

    expect(retried.errors).toBe(2);
    expect(retried.error).toBe('socket hang up');
    expect(step.countError('y'.repeat(RadarStepRun.MAX_ERROR + 10)).error).toHaveLength(RadarStepRun.MAX_ERROR);
    expect(retried.finish(NOW)).toMatchObject({ status: RadarStatus.DONE, error: null });
  });
});
