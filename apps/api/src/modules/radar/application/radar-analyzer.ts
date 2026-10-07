import { z } from 'zod/v4';

import { AiCallError, type AiFeature, type AiStructuredResult, type AiTool, type IAiClient } from '../../ai';
import { RadarAnalysisDepth } from '../domain/radar-analysis.types';
import { RadarAnalysisAnswerSchema, RadarAnalysisOptions, RadarAnalysisPrompt } from './prompts/radar-analysis.prompt';
import { RadarAnalysisConfig } from './radar-analysis.config';
import { RadarEnrichmentSchema } from './radar-enrichment.schema';
import { RadarWorkItemDto } from './radar.dto';

export type RadarEnrichmentData = z.infer<typeof RadarEnrichmentSchema>;

/**
 * How one item's analysis ended:
 * - `answered`: a valid enrichment, with the call that produced it;
 * - `refused`: a model gave an invalid answer twice (the rule allows one retry);
 * - `busy`: every model was rate-limited or down, worth a later try;
 * - `failed`: every model failed for good;
 * - `capped`: the AI client refused the call because the daily spend cap is reached.
 */
export type RadarAnalysisOutcome =
  | { kind: 'answered'; enrichment: RadarEnrichmentData; call: AiStructuredResult<unknown> }
  | { kind: 'refused'; reason: string }
  | { kind: 'busy' }
  | { kind: 'failed'; reason: string }
  | { kind: 'capped' };

/** Who the call is for in the usage ledger, and which models to try (the depth's chain by default). */
export interface RadarAnalysisCall {
  feature: AiFeature;
  group?: { type: string; id: string };
  models?: readonly string[];
}

/**
 * One item's analysis at one depth: a single structured request per attempt (AI-001: no agent
 * loop), the model chain, and the retry rules. It stores nothing: the AUTO adapter saves the result
 * as the item's enrichment, a quality trial saves it next to it.
 * - an answer that fails validation is retried once with the reason attached, then the item is refused;
 * - a busy model (429, 503, timeout, network) hands over to the next model in the chain;
 * - an auth or missing-key error is thrown: no item can succeed until it is fixed.
 */
export class RadarAnalyzer {
  // --- Constants ---

  private static readonly FATAL = new Set(['auth', 'not-configured']);
  private static readonly BUSY = new Set(['rate-limited', 'unavailable', 'network']);

  constructor(
    private readonly ai: IAiClient,
    private readonly config: RadarAnalysisConfig
  ) {}

  async analyze(
    item: RadarWorkItemDto,
    depth: RadarAnalysisDepth,
    system: string,
    call: RadarAnalysisCall
  ): Promise<RadarAnalysisOutcome> {
    const { deep, light } = this.config;
    const options: RadarAnalysisOptions =
      depth === 'deep'
        ? { depth, maxImages: deep.maxImages, webSearch: deep.webSearch, maxSearchQueries: deep.maxSearchQueries }
        : { depth, maxImages: light.maxImages, deepMinScore: deep.maxPerRun > 0 ? deep.minScore : null };
    const tools: AiTool[] = depth === 'light' ? [] : deep.webSearch ? ['webSearch', 'readUrls'] : ['readUrls'];
    const pass = depth === 'deep' ? deep : light;
    const parts = RadarAnalysisPrompt.parts(item, options);
    let busy = false;
    let lastError = 'No model answered';

    for (const model of call.models ?? pass.models) {
      let refused: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await this.ai.generateStructured({
            model,
            system,
            parts: refused ? RadarAnalysisPrompt.retryParts(parts, refused) : parts,
            schema: RadarAnalysisAnswerSchema,
            feature: call.feature,
            ref: { type: 'radar-item', id: item.id },
            group: call.group,
            tools,
            limits: { maxOutputTokens: pass.maxOutputTokens, timeoutMs: this.config.timeoutMs, effort: pass.effort },
          });
          const enrichment = RadarEnrichmentSchema.safeParse(
            RadarAnalysisPrompt.toEnrichment(result.data, { adapter: this.ai.provider, model: result.model })
          );
          if (enrichment.success) return { kind: 'answered', enrichment: enrichment.data, call: result };
          refused = RadarAnalyzer.describe(enrichment.error);
        } catch (error) {
          if (!(error instanceof AiCallError)) throw error;
          if (RadarAnalyzer.FATAL.has(error.kind)) throw error;
          if (error.kind === 'over-budget') return { kind: 'capped' };
          if (error.kind !== 'invalid-output') {
            busy ||= RadarAnalyzer.BUSY.has(error.kind);
            lastError = error.message;
            refused = null;
            break;
          }
          refused = error.message;
        }
      }
      // Refused twice: the model, not the provider, is the problem, and the rule allows one retry.
      if (refused) return { kind: 'refused', reason: `Invalid answer after one retry (${model}): ${refused}` };
    }
    return busy ? { kind: 'busy' } : { kind: 'failed', reason: lastError };
  }

  // --- Private ---

  private static describe(error: z.ZodError): string {
    return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
  }
}
