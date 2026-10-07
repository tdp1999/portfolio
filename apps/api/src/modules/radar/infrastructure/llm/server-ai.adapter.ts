import { Logger } from '@nestjs/common';
import { z } from 'zod/v4';

import { AiCallError, type AiTool, type IAiClient } from '../../../ai';
import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
import {
  ILlmProvider,
  LlmStepOutcome,
  LlmStepRequest,
  SERVER_AI_ADAPTER,
} from '../../application/ports/llm-provider.port';
import { IRadarProfileRepository } from '../../application/ports/radar-profile.repository.port';
import { IRadarWorkRepository, RadarWorkSnapshot } from '../../application/ports/radar-work.repository.port';
import {
  RadarAnalysisOptions,
  RadarAnalysisPrompt,
  RadarAnalysisAnswerSchema,
} from '../../application/prompts/radar-analysis.prompt';
import { RADAR_RUN_AI_GROUP, RadarAnalysisConfig } from '../../application/radar-analysis.config';
import { RadarEnrichmentSchema } from '../../application/radar-enrichment.schema';
import { RadarPresenter } from '../../application/radar.presenter';

/**
 * What happened to one item. `busy`: every model was rate-limited or down, try on a later tick.
 * `capped`: the AI client refused the call because the daily spend cap is reached.
 */
type ItemResult = 'stored' | 'failed' | 'busy' | 'capped';

type Group = { type: string; id: string };

/**
 * The AUTO analysis, in two depths so money goes to the posts worth it:
 * - light: every item of the run, claimed a few per tick, on a cheap model chain with no web search
 *   and no link reading (images, TL;DR, score);
 * - deep: only items whose light score reaches the threshold, at most N per run, on a stronger
 *   chain with search and link reading (research, fact check, reasoning). A deep result replaces the light one; a failed deep analysis keeps it.
 * Each tick does deep candidates first (the best posts get researched while budget remains), then
 * light items. Each item is a single structured request through the AI client (AI-001: no agent
 * loop). App code owns every retry decision:
 * - an answer that fails validation is retried once with the reason attached, then the item fails;
 * - a busy model (429, 503, timeout, network) hands over to the next model in the chain; when all
 *   are busy the item goes back to the queue uncounted and the tick stops; a run whose provider
 *   stays busy for `BUSY_GIVE_UP_MS` with no item analyzed stops instead of waiting forever;
 * - the run's budget is checked before each item, and the AI client's daily cap before each call;
 *   once either is reached the run stops and the rest stays pending.
 */
export class ServerAiAdapter implements ILlmProvider {
  // --- Constants ---

  /** Not the provider's fault and not the item's: the whole tick stops and the step records an error. */
  private static readonly FATAL = new Set(['auth', 'not-configured']);
  private static readonly BUSY = new Set(['rate-limited', 'unavailable', 'network']);
  private static readonly BUDGET_REACHED = "The run's AI budget is reached; the remaining items stay pending";
  private static readonly DAILY_CAP_REACHED = 'The daily AI spend cap is reached; the remaining items stay pending';
  /** How long a run waits on a busy provider (no item analyzed) before it stops. */
  private static readonly BUSY_GIVE_UP_MS = 30 * 60_000;
  private static readonly STAYED_BUSY =
    'The AI provider stayed busy (rate-limited or down) for 30 minutes; the remaining items stay pending';

  readonly name = SERVER_AI_ADAPTER;
  readonly serverSide = true;
  private readonly logger = new Logger(ServerAiAdapter.name);
  /** Per run: when the provider started answering busy with no item analyzed since. In memory: a restart starts a fresh wait. */
  private readonly busySince = new Map<string, number>();

  constructor(
    private readonly ai: IAiClient,
    private readonly work: IRadarWorkRepository,
    private readonly profiles: IRadarProfileRepository,
    private readonly config: RadarAnalysisConfig
  ) {}

  async process({ runId, budgetMicroUsd }: LlmStepRequest): Promise<LlmStepOutcome> {
    const group: Group = { type: RADAR_RUN_AI_GROUP, id: runId };
    const overBudget = async () => budgetMicroUsd !== null && (await this.ai.spentMicroUsd(group)) >= budgetMicroUsd;
    if (await overBudget()) return { state: 'stopped', reason: ServerAiAdapter.BUDGET_REACHED };

    let depth: RadarAnalysisDepth = 'deep';
    let items: RadarWorkSnapshot[] = await this.deepCandidates(runId);
    if (items.length === 0) {
      depth = 'light';
      const now = new Date();
      items = await this.work.claim(
        this.config.batchSize,
        RadarLeasePolicy.expiresAt(now),
        now,
        RadarLeasePolicy.MAX_CLAIM_ATTEMPTS,
        runId
      );
    }
    if (items.length === 0) {
      this.busySince.delete(runId);
      return { state: 'idle' };
    }
    const system = RadarAnalysisPrompt.system((await this.profiles.find())?.body ?? null);
    // Only claimed (light) items hold a lease to give back; deep candidates are already DONE.
    const release = (from: number) =>
      depth === 'light'
        ? this.work.release(
            items.slice(from).map((item) => item.id),
            false
          )
        : Promise.resolve();

    for (let i = 0; i < items.length; i++) {
      if (i > 0 && (await overBudget())) {
        await release(i);
        return { state: 'stopped', reason: ServerAiAdapter.BUDGET_REACHED };
      }
      let result: ItemResult;
      try {
        result = await this.analyze(items[i], depth, system, group);
      } catch (error) {
        await release(i);
        throw error;
      }
      if (result === 'capped') {
        await release(i);
        return { state: 'stopped', reason: ServerAiAdapter.DAILY_CAP_REACHED };
      }
      if (result === 'busy') {
        await release(i);
        if (this.stayedBusy(runId)) return { state: 'stopped', reason: ServerAiAdapter.STAYED_BUSY };
        break;
      }
      this.busySince.delete(runId);
    }
    return { state: 'working' };
  }

  // --- Private ---

  /** Starts the run's busy wait, or says it has lasted long enough to stop (and forgets it). */
  private stayedBusy(runId: string): boolean {
    const now = Date.now();
    const since = this.busySince.get(runId) ?? now;
    if (now - since < ServerAiAdapter.BUSY_GIVE_UP_MS) {
      this.busySince.set(runId, since);
      return false;
    }
    this.busySince.delete(runId);
    return true;
  }

  private async deepCandidates(runId: string): Promise<RadarWorkSnapshot[]> {
    const { maxPerRun, minScore } = this.config.deep;
    if (maxPerRun === 0) return [];
    const left = maxPerRun - (await this.work.countDeep(runId));
    if (left <= 0) return [];
    return this.work.findDeepCandidates(runId, minScore, Math.min(this.config.batchSize, left));
  }

  private async analyze(
    item: RadarWorkSnapshot,
    depth: RadarAnalysisDepth,
    system: string,
    group: Group
  ): Promise<ItemResult> {
    const { deep, light } = this.config;
    const options: RadarAnalysisOptions =
      depth === 'deep'
        ? { depth, maxImages: deep.maxImages, webSearch: deep.webSearch, maxSearchQueries: deep.maxSearchQueries }
        : { depth, maxImages: light.maxImages, deepMinScore: deep.maxPerRun > 0 ? deep.minScore : null };
    const tools: AiTool[] = depth === 'light' ? [] : deep.webSearch ? ['webSearch', 'readUrls'] : ['readUrls'];
    const pass = depth === 'deep' ? deep : light;
    const parts = RadarAnalysisPrompt.parts(RadarPresenter.toWorkItem(item), options);
    let busy = false;
    let lastError = 'No model answered';

    for (const model of pass.models) {
      let refused: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await this.ai.generateStructured({
            model,
            system,
            parts: refused ? RadarAnalysisPrompt.retryParts(parts, refused) : parts,
            schema: RadarAnalysisAnswerSchema,
            feature: depth === 'deep' ? 'radar.analyze' : 'radar.analyze.light',
            ref: { type: 'radar-item', id: item.id },
            group,
            tools,
            limits: { maxOutputTokens: pass.maxOutputTokens, timeoutMs: this.config.timeoutMs, effort: pass.effort },
          });
          const enrichment = RadarEnrichmentSchema.safeParse(
            RadarAnalysisPrompt.toEnrichment(result.data, { adapter: this.ai.provider, model: result.model })
          );
          if (enrichment.success) return this.store(item.id, enrichment.data, depth);
          refused = ServerAiAdapter.describe(enrichment.error);
        } catch (error) {
          if (!(error instanceof AiCallError)) throw error;
          if (ServerAiAdapter.FATAL.has(error.kind)) throw error;
          if (error.kind === 'over-budget') return 'capped';
          if (error.kind !== 'invalid-output') {
            busy ||= ServerAiAdapter.BUSY.has(error.kind);
            lastError = error.message;
            refused = null;
            break;
          }
          refused = error.message;
        }
      }
      // Refused twice: the model, not the provider, is the problem, and the rule allows one retry.
      if (refused) return this.fail(item.id, depth, `Invalid answer after one retry (${model}): ${refused}`);
    }
    return busy ? 'busy' : this.fail(item.id, depth, lastError);
  }

  private async store(
    itemId: string,
    enrichment: z.infer<typeof RadarEnrichmentSchema>,
    depth: RadarAnalysisDepth
  ): Promise<ItemResult> {
    const item = await this.work.findById(itemId);
    if (item && (await this.work.saveEnrichment(item.takeEnrichment(), enrichment, depth))) return 'stored';
    this.logger.warn(`Radar item ${itemId} disappeared before its analysis was saved`);
    return 'failed';
  }

  /** A failed light analysis turns the item stuck; a failed deep one keeps the light result. */
  private async fail(itemId: string, depth: RadarAnalysisDepth, reason: string): Promise<ItemResult> {
    this.logger.warn(`Radar item ${itemId} ${depth} analysis failed: ${reason}`);
    if (depth === 'deep') await this.work.noteError(itemId, `Deep analysis failed: ${reason}`);
    else await this.work.markFailed(itemId, reason, RadarLeasePolicy.MAX_CLAIM_ATTEMPTS);
    return 'failed';
  }

  private static describe(error: z.ZodError): string {
    return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
  }
}
