import { RadarStatus, RadarStep } from '@prisma/client';

import { radarRunProps } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarRunMapper } from './radar-run.mapper';

const READ_AT = '2026-10-05T10:00:00Z';

/** The same run as read twice: equal values, fresh Date and meta objects. */
const read = () =>
  radarRunProps(
    { startedAt: new Date(READ_AT) },
    {
      [RadarStep.NORMALIZE]: {
        status: RadarStatus.RUNNING,
        meta: { datasetRef: 'ds', offset: 0 },
        startedAt: new Date(READ_AT),
      },
    }
  );

describe('RadarRunMapper.changes()', () => {
  it('should find nothing to write for a run read again unchanged', () => {
    expect(RadarRunMapper.changes(read(), read())).toEqual({ run: {}, steps: [] });
  });

  it('should write only the changed fields of the changed step, guarded on the status it was read in', () => {
    const current = read();
    current.steps = current.steps.map((s) =>
      s.step === RadarStep.NORMALIZE ? { ...s, meta: { datasetRef: 'ds', offset: 100 } } : s
    );

    expect(RadarRunMapper.changes(read(), current)).toEqual({
      run: {},
      steps: [
        {
          step: RadarStep.NORMALIZE,
          loadedStatus: RadarStatus.RUNNING,
          data: { meta: { datasetRef: 'ds', offset: 100 } },
        },
      ],
    });
  });
});
