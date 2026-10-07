import type { AiEffort } from '../../ai';

export const RADAR_ANALYSIS_CONFIG = Symbol('RADAR_ANALYSIS_CONFIG');
/** The AI ledger group of one run's calls: `{ type: RADAR_RUN_AI_GROUP, id: runId }`. */
export const RADAR_RUN_AI_GROUP = 'radar-run';

/**
 * Model chains, tried in order for each item: the next model takes over when one is busy or
 * refuses. Light reads images, writes the TL;DR and scores: Flash-Lite is enough. Deep researches,
 * fact-checks and reasons about the field: a Flash model. Override with `RADAR_AI_LIGHT_MODELS` and
 * `RADAR_AI_DEEP_MODELS` (comma-separated).
 */
export const DEFAULT_RADAR_AI_LIGHT_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite'];
export const DEFAULT_RADAR_AI_DEEP_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash'];
/**
 * A brief reads the window's analyses (already researched) and writes one long document: a Flash
 * model, no tools. Override with `RADAR_AI_BRIEF_MODELS`.
 */
export const DEFAULT_RADAR_AI_BRIEF_MODELS = DEFAULT_RADAR_AI_DEEP_MODELS;
/**
 * A transcript watches and listens to a video: a Flash model, which reads Vietnamese speech and
 * slides well at low media resolution. Override with `RADAR_AI_TRANSCRIPT_MODELS`.
 */
export const DEFAULT_RADAR_AI_TRANSCRIPT_MODELS = DEFAULT_RADAR_AI_DEEP_MODELS;
/** Longest video file (a reel) sent for a transcript: 10 minutes. Override with `RADAR_TRANSCRIPT_MAX_SECONDS`. */
export const DEFAULT_RADAR_TRANSCRIPT_MAX_SECONDS = 600;
/**
 * Longest YouTube video: 45 minutes, about 260K input tokens at low resolution. Talks run long, so
 * this limit is separate from the reels one. Override with `RADAR_TRANSCRIPT_YOUTUBE_MAX_SECONDS`.
 */
export const DEFAULT_RADAR_TRANSCRIPT_YOUTUBE_MAX_SECONDS = 2_700;
/** One AUTO run's AI spend cap when the Owner names none: $1. */
export const DEFAULT_RADAR_AI_BUDGET_MICRO_USD = 1_000_000;
/** Items analyzed per tick: small, so one tick stays short and memory stays flat (task 387). */
export const DEFAULT_RADAR_AI_BATCH = 3;
/** A light score from which an item earns the deep analysis. Override with `RADAR_AI_DEEP_MIN_SCORE`. */
export const DEFAULT_RADAR_AI_DEEP_MIN_SCORE = 7;
/** Deep analyses per run at most; 0 turns the deep pass off. Override with `RADAR_AI_DEEP_MAX`. */
export const DEFAULT_RADAR_AI_DEEP_MAX = 15;

/** Which models one pass uses, and what it may send and spend per item. */
export interface RadarAnalysisPass {
  models: string[];
  /** Thinking is billed as output, the priciest part of a call: low for light, medium for deep. */
  effort: AiEffort;
  maxImages: number;
  /** Room for the answer and the model's thinking. */
  maxOutputTokens: number;
}

export interface RadarAnalysisConfig {
  /** Per run, unless the Owner sets one when creating the run. `RADAR_AI_BUDGET_USD` overrides. */
  defaultBudgetMicroUsd: number;
  batchSize: number;
  timeoutMs: number;
  /** Every item: no web search, no link reading, a few images. */
  light: RadarAnalysisPass;
  /** Only items whose light score reaches `minScore`, at most `maxPerRun` per run. */
  deep: RadarAnalysisPass & {
    minScore: number;
    maxPerRun: number;
    /** Web search on or off; off when `RADAR_AI_SEARCH=off`. Search is billed per query. */
    webSearch: boolean;
    /** Search queries the prompt allows per item. A prompt rule, not a hard cap: no provider exposes one. */
    maxSearchQueries: number;
  };
  /** An AUTO brief: one request over the window's analyses, so a longer timeout and answer. */
  brief: Omit<RadarAnalysisPass, 'maxImages'> & { timeoutMs: number };
  /** A video's transcript, made in ENRICH of an AUTO run before the analysis reads it. */
  transcript: Omit<RadarAnalysisPass, 'maxImages'> & {
    timeoutMs: number;
    /** Longer video files (reels) are skipped with a reason. */
    maxSeconds: number;
    /** The same for YouTube videos, which Gemini reads by URL. */
    youtubeMaxSeconds: number;
    /** Videos per tick, one after another, so only one file is ever in memory. */
    perTick: number;
  };
}

/** Reads the analysis settings. All optional: the defaults are a working setup. */
export function loadRadarAnalysisConfig(env: NodeJS.ProcessEnv = process.env): RadarAnalysisConfig {
  const budgetUsd = Number(env['RADAR_AI_BUDGET_USD']);
  return {
    defaultBudgetMicroUsd:
      Number.isFinite(budgetUsd) && budgetUsd > 0
        ? Math.round(budgetUsd * 1_000_000)
        : DEFAULT_RADAR_AI_BUDGET_MICRO_USD,
    batchSize: DEFAULT_RADAR_AI_BATCH,
    timeoutMs: 120_000,
    light: {
      models: modelList(env['RADAR_AI_LIGHT_MODELS']) ?? DEFAULT_RADAR_AI_LIGHT_MODELS,
      effort: 'low',
      maxImages: 3,
      maxOutputTokens: 8_000,
    },
    deep: {
      models: modelList(env['RADAR_AI_DEEP_MODELS']) ?? DEFAULT_RADAR_AI_DEEP_MODELS,
      effort: 'medium',
      maxImages: 8,
      maxOutputTokens: 16_000,
      minScore: intIn(env['RADAR_AI_DEEP_MIN_SCORE'], 0, 10) ?? DEFAULT_RADAR_AI_DEEP_MIN_SCORE,
      maxPerRun: intIn(env['RADAR_AI_DEEP_MAX'], 0, 1_500) ?? DEFAULT_RADAR_AI_DEEP_MAX,
      webSearch: env['RADAR_AI_SEARCH']?.trim().toLowerCase() !== 'off',
      maxSearchQueries: 2,
    },
    brief: {
      models: modelList(env['RADAR_AI_BRIEF_MODELS']) ?? DEFAULT_RADAR_AI_BRIEF_MODELS,
      effort: 'medium',
      maxOutputTokens: 32_000,
      timeoutMs: 300_000,
    },
    transcript: {
      models: modelList(env['RADAR_AI_TRANSCRIPT_MODELS']) ?? DEFAULT_RADAR_AI_TRANSCRIPT_MODELS,
      effort: 'low',
      maxOutputTokens: 16_000,
      // A 45-minute talk takes Gemini a few minutes to watch; a reel takes seconds.
      timeoutMs: 300_000,
      maxSeconds: intIn(env['RADAR_TRANSCRIPT_MAX_SECONDS'], 10, 3_600) ?? DEFAULT_RADAR_TRANSCRIPT_MAX_SECONDS,
      youtubeMaxSeconds:
        intIn(env['RADAR_TRANSCRIPT_YOUTUBE_MAX_SECONDS'], 10, 10_800) ?? DEFAULT_RADAR_TRANSCRIPT_YOUTUBE_MAX_SECONDS,
      perTick: 3,
    },
  };
}

/** Model ids from a comma-separated env value, or null when none is valid. */
function modelList(value: string | undefined): string[] | null {
  const models = (value ?? '')
    .split(',')
    .map((m) => m.trim())
    .filter((m) => /^[a-z0-9.-]{1,100}$/.test(m));
  return models.length > 0 ? models : null;
}

/** An integer from the env within bounds, or null when unset or out of range. */
function intIn(value: string | undefined, min: number, max: number): number | null {
  if (value === undefined || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}
