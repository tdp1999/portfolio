import { AiCallError, type IAiClient } from '../../ai';
import { RadarTranscriptJob } from '../domain/radar-transcript.types';
import { IMediaDownloader } from './ports/media-downloader.port';
import { loadRadarAnalysisConfig } from './radar-analysis.config';
import { RadarTranscriber } from './radar-transcriber';

const config = loadRadarAnalysisConfig({}).transcript;
const [MODEL_1, MODEL_2] = config.models;
const group = { type: 'radar-run', id: '01a10b5b-9d90-753e-a6a3-000000000001' };
const job = (over: Partial<RadarTranscriptJob> = {}): RadarTranscriptJob => ({
  itemId: '01a10b5b-9d90-753e-a6a3-000000000101',
  videoUrl: 'https://video.xx.fbcdn.net/r.mp4',
  durationSec: 60,
  attempts: 0,
  ...over,
});
const answer = { spoken: 'Xin chào', onScreenText: 'claude --help', visualSummary: 'A terminal demo', language: 'vi' };
const busy = () => new AiCallError('rate-limited', '429 Too Many Requests');

describe('RadarTranscriber', () => {
  let ai: jest.Mocked<IAiClient>;
  let downloader: jest.Mocked<IMediaDownloader>;
  const transcriber = () => new RadarTranscriber(ai, config, downloader);

  beforeEach(() => {
    ai = { configured: true, generateStructured: jest.fn() } as unknown as jest.Mocked<IAiClient>;
    downloader = { download: jest.fn().mockResolvedValue({ buffer: Buffer.from('mp4'), mimeType: 'video/mp4' }) };
  });

  it('should hand a busy model over to the next one and send the file inline at low resolution', async () => {
    ai.generateStructured
      .mockRejectedValueOnce(busy())
      .mockResolvedValueOnce({ data: answer, model: MODEL_2 } as never);

    const result = await transcriber().transcribe(job(), group);

    expect(result).toMatchObject({ status: 'DONE', transcript: { spoken: 'Xin chào', language: 'vi' } });
    expect(ai.generateStructured.mock.calls.map(([r]) => r.model)).toEqual([MODEL_1, MODEL_2]);
    expect(ai.generateStructured.mock.calls[0][0]).toMatchObject({
      feature: 'radar.transcript',
      group,
      parts: expect.arrayContaining([
        { inlineData: { data: Buffer.from('mp4').toString('base64'), mimeType: 'video/mp4' }, resolution: 'low' },
      ]),
    });
  });

  it('should leave the item waiting when every model is busy', async () => {
    ai.generateStructured.mockRejectedValue(busy());

    expect(await transcriber().transcribe(job(), group)).toEqual({ status: 'PENDING', attempts: 1 });
  });

  it('should fail without any AI call when the video cannot be downloaded', async () => {
    downloader.download.mockRejectedValue(new Error('HTTP 403'));

    expect(await transcriber().transcribe(job(), group)).toEqual({
      status: 'FAILED',
      error: 'Could not download the video: HTTP 403',
      attempts: 0,
    });
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it('should fail at once on the daily cap without trying the next model', async () => {
    ai.generateStructured.mockRejectedValue(new AiCallError('over-budget', 'cap'));

    expect(await transcriber().transcribe(job(), group)).toMatchObject({
      status: 'FAILED',
      error: 'The daily AI spend cap is reached',
    });
    expect(ai.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('should fail at once on an unreadable answer instead of billing the video again on the next model', async () => {
    ai.generateStructured.mockRejectedValue(
      new AiCallError('invalid-output', 'The answer is not JSON (stopped early: MAX_TOKENS)')
    );

    expect(await transcriber().transcribe(job(), group)).toMatchObject({
      status: 'FAILED',
      error: 'The transcript could not be read: The answer is not JSON (stopped early: MAX_TOKENS)',
    });
    expect(ai.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('should pass a YouTube URL as a file part without downloading it', async () => {
    ai.generateStructured.mockResolvedValue({ data: answer, model: MODEL_1 } as never);
    const url = 'https://www.youtube.com/watch?v=abc123';

    await transcriber().transcribe(job({ videoUrl: url }), group);

    expect(downloader.download).not.toHaveBeenCalled();
    expect(ai.generateStructured.mock.calls[0][0].parts).toContainEqual({
      fileUri: url,
      mimeType: 'video/mp4',
      resolution: 'low',
    });
  });
});
