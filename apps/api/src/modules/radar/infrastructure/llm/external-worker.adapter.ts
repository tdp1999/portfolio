import { EXTERNAL_WORKER_ADAPTER, ILlmProvider, LlmStepOutcome } from '../../application/ports/llm-provider.port';

/**
 * The analysis happens outside the API: Claude Code runs `/radar work`, claims items through the
 * worker endpoints (task 404) and submits enrichments. The step only parks and waits.
 */
export class ExternalWorkerAdapter implements ILlmProvider {
  readonly name = EXTERNAL_WORKER_ADAPTER;

  async process(): Promise<LlmStepOutcome> {
    return { state: 'awaiting-external' };
  }
}
