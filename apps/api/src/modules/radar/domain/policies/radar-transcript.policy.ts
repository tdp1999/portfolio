import { RadarTranscriptJob, RadarTranscriptResult } from '../radar-transcript.types';

/** When a video is sent for a transcript, what it is expected to cost, and when a busy provider ends it. */
export class RadarTranscriptPolicy {
  // --- Constants ---

  /** Tries a busy provider may turn away before the item fails, so ENRICH never waits forever (RAD-008). */
  static readonly MAX_ATTEMPTS = 3;
  /** Gemini at low media resolution: 64 tokens per frame at one frame a second, plus 32 per second of audio. */
  static readonly TOKENS_PER_SECOND = 96;
  /** The rules and the request text. */
  static readonly PROMPT_TOKENS = 1_500;
  private static readonly YOUTUBE = /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//;

  // --- Rules ---

  /** A public YouTube video is read by URL; any other video file is downloaded and sent inline. */
  static isYouTube(url: string): boolean {
    return RadarTranscriptPolicy.YOUTUBE.test(url);
  }

  /** The length limit that applies to a video: YouTube talks have their own, longer one. */
  static maxSecondsFor(videoUrl: string, limits: { maxSeconds: number; youtubeMaxSeconds: number }): number {
    return RadarTranscriptPolicy.isYouTube(videoUrl) ? limits.youtubeMaxSeconds : limits.maxSeconds;
  }

  /** Why the video is not sent at all, or null. An unknown length is checked by the download's size cap instead. */
  static skipReason(job: RadarTranscriptJob, maxSeconds: number): string | null {
    if (job.durationSec === null || job.durationSec <= maxSeconds) return null;
    return `The video runs ${RadarTranscriptPolicy.minutes(job.durationSec)}, longer than the ${RadarTranscriptPolicy.minutes(maxSeconds)} limit`;
  }

  /**
   * Tokens one call may use, on the high side so the run budget is never undercounted: an unknown
   * length is taken as the longest video allowed, and the output as the whole output cap (Gemini
   * counts thinking inside it, so the cap bounds both).
   */
  static estimatedTokens(
    durationSec: number | null,
    maxSeconds: number,
    maxOutputTokens: number
  ): { input: number; output: number } {
    const seconds = durationSec ?? maxSeconds;
    return {
      input: RadarTranscriptPolicy.PROMPT_TOKENS + seconds * RadarTranscriptPolicy.TOKENS_PER_SECOND,
      output: maxOutputTokens,
    };
  }

  /** Every model was busy: wait for a later tick, unless this was the last try. */
  static afterBusy(job: RadarTranscriptJob): RadarTranscriptResult {
    const attempts = job.attempts + 1;
    return attempts < RadarTranscriptPolicy.MAX_ATTEMPTS
      ? { status: 'PENDING', attempts }
      : { status: 'FAILED', error: `Every model stayed busy after ${attempts} tries`, attempts };
  }

  // --- Private ---

  private static minutes(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m} min` : `${m} min ${s} s`;
  }
}
