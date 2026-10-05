import { RadarStep } from '@prisma/client';

/** Claude Code through the worker endpoints (task 404); the only adapter until Phase C. */
export const EXTERNAL_WORKER_ADAPTER = 'external-worker';

export interface LlmStepRequest {
  step: RadarStep;
  runId: string;
}

export type LlmStepOutcome =
  /** The work happens outside the API (the `/radar work` skill); the step waits for it. */
  | { state: 'awaiting-external' }
  /** A server-side adapter finished the step itself. */
  | { state: 'done' };

/**
 * An analysis provider, chosen per run by adapter name (the run's `llmAdapter`), not once per
 * process. A server-side adapter (Phase C) loads the run's items and the workflow profile itself,
 * so the state machine does not hold them for an adapter that never reads them.
 */
export interface ILlmProvider {
  readonly name: string;
  process(request: LlmStepRequest): Promise<LlmStepOutcome>;
}
