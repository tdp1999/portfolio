import { RadarStep } from '@prisma/client';

/** Claude Code through the worker endpoints (task 404): the MANUAL and HYBRID analysis. */
export const EXTERNAL_WORKER_ADAPTER = 'external-worker';
/** The server-side analysis through the AI client (task 418): the AUTO analysis. */
export const SERVER_AI_ADAPTER = 'server-ai';

export interface LlmStepRequest {
  step: RadarStep;
  runId: string;
  /** The run's AI spend cap; null means the run has none. */
  budgetMicroUsd: number | null;
  /** Posts whose quick score reaches the threshold also get the deep analysis (ADR-036: off by default). */
  deepAnalysis: boolean;
}

export type LlmStepOutcome =
  /** The work happens outside the API (the `/radar work` skill); the step waits for it. */
  | { state: 'awaiting-external' }
  /** A server-side adapter finished the step itself. */
  | { state: 'done' }
  /** A server-side adapter did one batch this tick; more may follow on the next. */
  | { state: 'working' }
  /** A server-side adapter found nothing to do; the step ends once no item of the run is left. */
  | { state: 'idle' }
  /** A server-side adapter stopped for good (budget or daily cap reached); the remaining items stay pending. */
  | { state: 'stopped'; reason: string };

/**
 * An analysis provider, chosen per run by adapter name (the run's `llmAdapter`), not once per
 * process. A server-side adapter loads the run's items and the workflow profile itself, so the
 * state machine does not hold them for an adapter that never reads them. An external adapter is
 * called once, when the step starts; a server-side one (`serverSide`) on every tick.
 */
export interface ILlmProvider {
  readonly name: string;
  readonly serverSide: boolean;
  process(request: LlmStepRequest): Promise<LlmStepOutcome>;
}
