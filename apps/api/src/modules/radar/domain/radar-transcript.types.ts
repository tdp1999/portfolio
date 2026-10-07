/**
 * What a video says and shows, read by the AI before the analysis. A silent video still has
 * `visualSummary` and usually `onScreenText`; only `spoken` is null then.
 */
export interface RadarTranscript {
  spoken: string | null;
  onScreenText: string | null;
  visualSummary: string;
  /** The spoken or written language, as a BCP 47 tag ("vi", "en"); null when the video has neither. */
  language: string | null;
}

export type RadarTranscriptStatus = 'NONE' | 'PENDING' | 'DONE' | 'FAILED';

/** What an item's video has: its length and its transcript, without the file URL (it stays on the server). */
export interface RadarItemVideo {
  durationSec: number | null;
  transcriptStatus: RadarTranscriptStatus;
  transcript: RadarTranscript | null;
  transcriptError: string | null;
}

/** A video item that still needs its transcript. */
export interface RadarTranscriptJob {
  itemId: string;
  videoUrl: string;
  durationSec: number | null;
  /** Earlier tries a busy provider turned away. */
  attempts: number;
}

/** What one try leaves on the item. */
export type RadarTranscriptResult =
  | { status: 'DONE'; transcript: RadarTranscript }
  | { status: 'PENDING'; attempts: number }
  | { status: 'FAILED'; error: string; attempts: number };
