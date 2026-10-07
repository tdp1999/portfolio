import { AiCallError, type AiRef, type IAiClient } from '../../ai';
import { RadarTranscriptPolicy } from '../domain/policies/radar-transcript.policy';
import { RadarTranscriptJob, RadarTranscriptResult } from '../domain/radar-transcript.types';
import { IMediaDownloader } from './ports/media-downloader.port';
import { RadarTranscriptAnswerSchema, RadarTranscriptPrompt } from './prompts/radar-transcript.prompt';
import { RadarAnalysisConfig } from './radar-analysis.config';

/**
 * One video's transcript: a single structured request per model (AI-001), the model chain, and how
 * each failure ends. It never throws for a provider or download problem: every outcome is a result
 * to save on the item, and a FAILED one still lets the analysis run (RAD-008).
 * - a busy model (429, 503, timeout, network) hands over to the next one; all busy waits for a later tick;
 * - the daily cap, a missing or wrong key, an answer that cannot be read, or a file that cannot be
 *   downloaded fails the item at once. An unreadable answer is usually one cut off at the output cap,
 *   and the next model would bill the whole video again only to stop at the same cap.
 */
export class RadarTranscriber {
  // --- Constants ---

  private static readonly BUSY = new Set(['rate-limited', 'unavailable', 'network']);

  constructor(
    private readonly ai: IAiClient,
    private readonly config: RadarAnalysisConfig['transcript'],
    private readonly downloader: IMediaDownloader
  ) {}

  async transcribe(job: RadarTranscriptJob, group: AiRef): Promise<RadarTranscriptResult> {
    const failed = (error: string): RadarTranscriptResult => ({ status: 'FAILED', error, attempts: job.attempts });

    // The file lives only in this call: downloaded, encoded, sent, then dropped with the scope.
    let video: { fileUri: string } | { data: string; mimeType: string };
    if (RadarTranscriptPolicy.isYouTube(job.videoUrl)) {
      video = { fileUri: job.videoUrl };
    } else {
      try {
        const { buffer, mimeType } = await this.downloader.download(job.videoUrl);
        video = { data: buffer.toString('base64'), mimeType };
      } catch (error) {
        return failed(`Could not download the video: ${RadarTranscriber.message(error)}`);
      }
    }

    const parts = RadarTranscriptPrompt.parts(video);
    let busy = false;
    let lastError = 'No model answered';
    for (const model of this.config.models) {
      try {
        const { data } = await this.ai.generateStructured({
          model,
          system: RadarTranscriptPrompt.SYSTEM,
          parts,
          schema: RadarTranscriptAnswerSchema,
          feature: 'radar.transcript',
          ref: { type: 'radar-item', id: job.itemId },
          group,
          limits: {
            maxOutputTokens: this.config.maxOutputTokens,
            timeoutMs: this.config.timeoutMs,
            effort: this.config.effort,
          },
        });
        return { status: 'DONE', transcript: RadarTranscriptPrompt.toTranscript(data) };
      } catch (error) {
        if (!(error instanceof AiCallError)) throw error;
        if (error.kind === 'over-budget') return failed('The daily AI spend cap is reached');
        if (error.kind === 'auth' || error.kind === 'not-configured') return failed(error.message);
        if (error.kind === 'invalid-output') return failed(`The transcript could not be read: ${error.message}`);
        busy ||= RadarTranscriber.BUSY.has(error.kind);
        lastError = error.message;
      }
    }
    return busy ? RadarTranscriptPolicy.afterBusy(job) : failed(lastError);
  }

  // --- Private ---

  private static message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
