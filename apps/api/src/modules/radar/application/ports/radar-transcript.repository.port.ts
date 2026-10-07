import { RadarTranscriptJob, RadarTranscriptResult } from '../../domain/radar-transcript.types';

export interface IRadarTranscriptRepository {
  /** The run's video items whose transcript is not settled (NONE or PENDING), oldest first. */
  findWaiting(runId: string, limit: number): Promise<RadarTranscriptJob[]>;
  countWaiting(runId: string): Promise<number>;
  /** Writes one try's outcome; an item deleted meanwhile is skipped. */
  save(itemId: string, result: RadarTranscriptResult): Promise<void>;
}
