import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RadarBriefWriter } from '@prisma/client';

import { DomainError, RadarErrorCode } from '@portfolio/shared/errors';

import { AI_CLIENT, AiCallError, type IAiClient } from '../../../ai';
import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarBriefRepository, RadarBriefWorkItem } from '../ports/radar-brief.repository.port';
import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { RadarBriefAnswerSchema, RadarBriefPrompt } from '../prompts/radar-brief.prompt';
import { RADAR_ANALYSIS_CONFIG, RadarAnalysisConfig } from '../radar-analysis.config';
import { RADAR_BRIEF_REPOSITORY, RADAR_PROFILE_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** What one tick did with AUTO briefs. */
export type WriteAutoBriefOutcome = 'idle' | 'written' | 'failed' | 'busy';

/**
 * Writes the oldest pending AUTO brief with one structured request over the window's analyses
 * (AI-001: no agent loop), then stores it through the same rule as a worker submit
 * ({@link RadarBrief.complete}). The tick sends this command; one brief per tick.
 * - a body whose links fail the rule is retried once with the reason, then the brief fails;
 * - a busy model hands over to the next one; when all are busy, or the daily cap is reached, the
 *   brief goes back to pending and a later tick tries again, for an hour at most;
 * - an auth or missing-key error, or any other failure, ends the brief failed with the reason.
 * Only one brief may wait at a time, so an AUTO brief must always end: without an AI key it fails
 * at once, and after an hour of busy models it fails too, which frees "New brief" again.
 */
export class WriteAutoBriefCommand {}

@CommandHandler(WriteAutoBriefCommand)
export class WriteAutoBriefHandler implements ICommandHandler<WriteAutoBriefCommand> {
  // --- Constants ---

  private static readonly FATAL = new Set(['auth', 'not-configured']);
  private static readonly BUSY = new Set(['rate-limited', 'unavailable', 'network']);
  /** Window items are read in pages, as the worker reads them. */
  private static readonly PAGE = 500;
  /** How long a brief may keep going back to pending before it is given up. */
  private static readonly MAX_WAIT_MS = 60 * 60_000;
  private static readonly NOT_CONFIGURED = 'Auto analysis is not configured (the server has no AI provider key)';

  private readonly logger = new Logger(WriteAutoBriefHandler.name);

  constructor(
    @Inject(AI_CLIENT) private readonly ai: IAiClient,
    @Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository,
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository,
    @Inject(RADAR_PROFILE_REPOSITORY) private readonly profiles: IRadarProfileRepository,
    @Inject(RADAR_ANALYSIS_CONFIG) private readonly config: RadarAnalysisConfig
  ) {}

  async execute(): Promise<WriteAutoBriefOutcome> {
    const now = new Date();
    const brief = await this.briefs.claim(RadarBriefWriter.AUTO, RadarLeasePolicy.expiresAt(now), now);
    if (!brief) return 'idle';
    // The key was removed after the request: the brief can never be written, so it ends here.
    if (!this.ai.configured) return this.fail(brief, WriteAutoBriefHandler.NOT_CONFIGURED);

    try {
      return await this.write(brief);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Radar brief ${brief.id} could not be written: ${reason}`);
      return this.fail(brief, reason);
    }
  }

  // --- Private ---

  private async write(brief: RadarBrief): Promise<WriteAutoBriefOutcome> {
    const items = await this.windowItems(brief);
    if (items.length === 0) return this.fail(brief, 'No analyzed posts fall in this window anymore');

    const source = brief.sourceId ? await this.sources.findById(brief.sourceId) : null;
    const system = RadarBriefPrompt.system((await this.profiles.find())?.body ?? null);
    const parts = RadarBriefPrompt.parts(
      brief,
      source?.displayName ?? null,
      RadarBriefPrompt.select(items),
      items.length
    );
    const windowIds = items.map((item) => item.id);
    const pass = this.config.brief;
    let busy = false;
    let lastError = 'No model answered';

    for (const model of pass.models) {
      let refused: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await this.ai.generateStructured({
            model,
            system,
            parts: refused ? RadarBriefPrompt.retryParts(parts, refused) : parts,
            schema: RadarBriefAnswerSchema,
            feature: 'radar.brief',
            ref: { type: 'radar-brief', id: brief.id },
            tools: [],
            limits: { maxOutputTokens: pass.maxOutputTokens, timeoutMs: pass.timeoutMs, effort: pass.effort },
          });
          const written = WriteAutoBriefHandler.complete(brief, result.data.body, windowIds, {
            adapter: this.ai.provider,
            model: result.model,
          });
          if (typeof written === 'string') {
            refused = written;
            continue;
          }
          if (!(await this.briefs.saveResult(written))) {
            this.logger.warn(`Radar brief ${brief.id} was no longer claimed when its body was ready`);
            return 'failed';
          }
          return 'written';
        } catch (error) {
          if (!(error instanceof AiCallError)) throw error;
          if (WriteAutoBriefHandler.FATAL.has(error.kind)) return this.fail(brief, error.message);
          if (error.kind === 'over-budget') return this.release(brief);
          if (error.kind !== 'invalid-output') {
            busy ||= WriteAutoBriefHandler.BUSY.has(error.kind);
            lastError = error.message;
            refused = null;
            break;
          }
          refused = error.message;
        }
      }
      if (refused) return this.fail(brief, `Invalid brief after one retry (${model}): ${refused}`);
    }
    return busy ? this.release(brief) : this.fail(brief, lastError);
  }

  /** Every analyzed post of the window, oldest first. */
  private async windowItems(brief: RadarBrief): Promise<RadarBriefWorkItem[]> {
    const items: RadarBriefWorkItem[] = [];
    for (let offset = 0; ; offset += WriteAutoBriefHandler.PAGE) {
      const page = await this.briefs.windowItems(brief, offset, WriteAutoBriefHandler.PAGE);
      items.push(...page.items);
      if (offset + WriteAutoBriefHandler.PAGE >= page.total) return items;
    }
  }

  private async release(brief: RadarBrief): Promise<WriteAutoBriefOutcome> {
    if (Date.now() - brief.createdAt.getTime() > WriteAutoBriefHandler.MAX_WAIT_MS) {
      return this.fail(brief, 'Gave up after an hour: every model stayed busy or the daily AI cap was reached');
    }
    await this.briefs.release(brief.id);
    return 'busy';
  }

  private async fail(brief: RadarBrief, reason: string): Promise<WriteAutoBriefOutcome> {
    this.logger.warn(`Radar brief ${brief.id} failed: ${reason}`);
    await this.briefs.saveResult(brief.fail(reason));
    return 'failed';
  }

  /** The written brief, or the reason its links were refused (worth one retry). */
  private static complete(
    brief: RadarBrief,
    body: string,
    windowIds: readonly string[],
    producer: { adapter: string; model: string }
  ): RadarBrief | string {
    try {
      return brief.complete(body, windowIds, producer);
    } catch (error) {
      if (!(error instanceof DomainError) || error.errorCode !== RadarErrorCode.BRIEF_INVALID_LINKS) throw error;
      const outside = (error.data as { outsideItemIds?: string[] } | undefined)?.outsideItemIds ?? [];
      return outside.length
        ? `These links point to posts outside the given list: ${outside.join(', ')}. Link only posts from the list.`
        : 'The brief has no link to a post. End every point with the posts it comes from.';
    }
  }
}
