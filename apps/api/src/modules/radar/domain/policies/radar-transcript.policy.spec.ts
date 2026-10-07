import { RadarTranscriptJob } from '../radar-transcript.types';
import { RadarTranscriptPolicy } from './radar-transcript.policy';

const job = (over: Partial<RadarTranscriptJob> = {}): RadarTranscriptJob => ({
  itemId: '01a10b5b-9d90-753e-a6a3-000000000101',
  videoUrl: 'https://video.xx.fbcdn.net/r.mp4',
  durationSec: 120,
  attempts: 0,
  ...over,
});

describe('RadarTranscriptPolicy', () => {
  describe('skipReason()', () => {
    it('should name both lengths when the video runs past the limit', () => {
      expect(RadarTranscriptPolicy.skipReason(job({ durationSec: 725 }), 600)).toBe(
        'The video runs 12 min 5 s, longer than the 10 min limit'
      );
    });

    it('should send a video at the limit and one of unknown length', () => {
      expect(RadarTranscriptPolicy.skipReason(job({ durationSec: 600 }), 600)).toBeNull();
      expect(RadarTranscriptPolicy.skipReason(job({ durationSec: null }), 600)).toBeNull();
    });
  });

  it('should give a YouTube video its own length limit', () => {
    const limits = { maxSeconds: 600, youtubeMaxSeconds: 2_700 };

    expect(RadarTranscriptPolicy.maxSecondsFor('https://www.youtube.com/watch?v=abc', limits)).toBe(2_700);
    expect(RadarTranscriptPolicy.maxSecondsFor('https://video.xx.fbcdn.net/r.mp4', limits)).toBe(600);
  });

  it('should estimate an unknown length as the longest video allowed and the output as the whole cap', () => {
    expect(RadarTranscriptPolicy.estimatedTokens(null, 600, 16_000)).toEqual(
      RadarTranscriptPolicy.estimatedTokens(600, 600, 16_000)
    );
    expect(RadarTranscriptPolicy.estimatedTokens(100, 600, 16_000)).toEqual({
      input: 1_500 + 100 * 96,
      output: 16_000,
    });
  });

  describe('afterBusy()', () => {
    it('should keep the item waiting before the last try', () => {
      expect(RadarTranscriptPolicy.afterBusy(job({ attempts: 1 }))).toEqual({ status: 'PENDING', attempts: 2 });
    });

    it('should fail the item on the last try', () => {
      expect(RadarTranscriptPolicy.afterBusy(job({ attempts: 2 }))).toEqual({
        status: 'FAILED',
        error: 'Every model stayed busy after 3 tries',
        attempts: 3,
      });
    });
  });
});
