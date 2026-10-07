import { RadarRunFlow } from '@prisma/client';

import type { IAiClient } from '../../../ai';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { radarRunProps } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarTranscriptJob } from '../../domain/radar-transcript.types';
import { IMediaDownloader } from '../ports/media-downloader.port';
import { IRadarTranscriptRepository } from '../ports/radar-transcript.repository.port';
import { loadRadarAnalysisConfig } from '../radar-analysis.config';
import { RunTranscriptsPhase } from './run.transcripts.phase';

const job: RadarTranscriptJob = {
  itemId: '01a10b5b-9d90-753e-a6a3-000000000101',
  videoUrl: 'https://video.xx.fbcdn.net/r.mp4',
  durationSec: 60,
  attempts: 0,
};
// $0.50 budget from the AUTO fixture.
const run = RadarRun.load(radarRunProps({ flow: RadarRunFlow.AUTO }));

describe('RunTranscriptsPhase', () => {
  let ai: jest.Mocked<IAiClient>;
  let repo: jest.Mocked<IRadarTranscriptRepository>;
  let downloader: jest.Mocked<IMediaDownloader>;
  const phase = () => new RunTranscriptsPhase(ai, repo, downloader, loadRadarAnalysisConfig({}));

  beforeEach(() => {
    ai = {
      configured: true,
      generateStructured: jest.fn(),
      spentMicroUsd: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<IAiClient>;
    repo = {
      findWaiting: jest.fn().mockResolvedValue([job]),
      countWaiting: jest.fn().mockResolvedValue(0),
      save: jest.fn(),
    };
    downloader = { download: jest.fn().mockRejectedValue(new Error('HTTP 403')) };
  });

  it('should skip a video whose estimated cost would pass the run budget, before downloading it (RAD-007)', async () => {
    ai.spentMicroUsd.mockResolvedValue(490_000);

    await phase().advance(run);

    expect(repo.save).toHaveBeenCalledWith(job.itemId, {
      status: 'FAILED',
      error: expect.stringMatching(/^Skipped: about \$0\.\d{3} would pass the run's budget$/),
      attempts: 0,
    });
    expect(downloader.download).not.toHaveBeenCalled();
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it('should fail the video at once when the server has no AI key', async () => {
    Object.assign(ai, { configured: false });

    await phase().advance(run);

    expect(repo.save).toHaveBeenCalledWith(job.itemId, {
      status: 'FAILED',
      error: 'The server has no AI key',
      attempts: 0,
    });
  });

  it('should report ENRICH settled only once no video of the run is waiting', async () => {
    repo.countWaiting.mockResolvedValueOnce(2);
    expect(await phase().advance(run)).toBe(false);

    repo.findWaiting.mockResolvedValueOnce([]);
    expect(await phase().advance(run)).toBe(true);
  });
});
