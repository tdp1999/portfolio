import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';

import { AiCostPolicy } from '../domain/policies/ai-cost.policy';
import type { AiCallStatus, AiTokenUsage, AiTrace } from '../domain/ai-usage.types';
import { AiCallError } from './ai-call.error';
import { AI_CONFIG, AI_PROVIDER, AI_USAGE_REPOSITORY } from './ai.token';
import type { AiConfig } from './ai.config';
import type { AiStructuredRequest, AiStructuredResult, IAiClient } from './ports/ai-client.port';
import type { IAiProvider } from './ports/ai-provider.port';
import type { IAiUsageRepository } from './ports/ai-usage.repository.port';

const NO_USAGE: AiTokenUsage = { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0, toolTokens: 0 };
/** Error text kept on a usage row; provider messages can be long JSON. */
const MAX_ERROR_LENGTH = 1000;

/**
 * The use case behind `IAiClient`: guard the request, call the provider, validate the answer and
 * record the call in the ledger whatever happened (AI-003).
 */
@Injectable()
export class AiClientService implements IAiClient {
  private static readonly EMPTY_TRACE: AiTrace = { searchQueries: [], sources: [], urls: [], finishReason: null };
  /** `refId` is a uuid column: a malformed id would fail the ledger write, not the call. */
  private static readonly REF_ID = z.uuid();
  private readonly logger = new Logger(AiClientService.name);

  constructor(
    @Inject(AI_CONFIG) private readonly config: AiConfig,
    @Inject(AI_PROVIDER) private readonly provider: IAiProvider,
    @Inject(AI_USAGE_REPOSITORY) private readonly usageRepo: IAiUsageRepository
  ) {}

  get configured(): boolean {
    return this.config.geminiApiKey !== null;
  }

  async generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>> {
    const tools = request.tools ?? [];
    // Not a call: nothing reaches the provider, so nothing is recorded.
    if (!this.configured) throw new AiCallError('not-configured', 'GEMINI_API_KEY is not set');
    if (tools.length > 0 && !request.limits) {
      throw new AiCallError('refused', 'Tools need limits (AI-002)');
    }
    if (request.ref && !AiClientService.REF_ID.safeParse(request.ref.id).success) {
      throw new AiCallError('refused', 'The ref id is not a uuid');
    }

    const model = request.model ?? this.config.defaultModel;
    const startedAt = Date.now();
    let usage = NO_USAGE;
    let trace: AiTrace | null = null;
    let data: T;
    try {
      const response = await this.provider.generate({
        model,
        system: request.system,
        parts: request.parts,
        jsonSchema: AiClientService.toJsonSchema(request.schema),
        tools,
        limits: request.limits,
      });
      usage = response.usage;
      trace = response.trace;
      data = AiClientService.parse(response.text, request.schema, response.trace.finishReason);
    } catch (err) {
      // An answer that fails validation still used tokens: they are recorded with the failure.
      // The message is redacted here, so no caller can return the key in a response (AI-004).
      const cause = err instanceof AiCallError ? err : null;
      const error = new AiCallError(
        cause?.kind ?? 'provider',
        this.redact(err instanceof Error ? err.message : String(err)),
        cause?.retryAfterMs ?? null
      );
      const status: AiCallStatus = error.kind === 'rate-limited' ? 'RATE_LIMITED' : 'FAILED';
      await this.record(request, model, status, error, usage, Date.now() - startedAt, trace);
      throw error;
    }
    const latencyMs = Date.now() - startedAt;
    const costMicroUsd = await this.record(request, model, 'SUCCEEDED', null, usage, latencyMs, trace);
    return { data, model, usage, costMicroUsd, latencyMs, trace: trace ?? AiClientService.EMPTY_TRACE };
  }

  // --- Private ---

  /**
   * Writes the usage row and returns the call's cost. A failed write is logged, never thrown: it
   * must not replace the call's real outcome (a paid answer, or a typed error the caller acts on).
   */
  private async record<T>(
    request: AiStructuredRequest<T>,
    model: string,
    status: AiCallStatus,
    error: AiCallError | null,
    usage: AiTokenUsage,
    latencyMs: number,
    trace: AiTrace | null
  ): Promise<number | null> {
    const costMicroUsd = AiCostPolicy.costMicroUsd(model, usage);
    try {
      await this.usageRepo.add({
        provider: this.provider.name,
        model,
        feature: request.feature,
        status,
        errorKind: error?.kind ?? null,
        error: error ? error.message.slice(0, MAX_ERROR_LENGTH) : null,
        usage,
        costMicroUsd,
        billed: this.config.billing === 'paid',
        latencyMs,
        ref: request.ref ?? null,
        trace,
      });
    } catch (err) {
      this.logger.error(
        `Could not record a ${status} ${request.feature} call: ${err instanceof Error ? err.message : err}`
      );
    }
    return costMicroUsd;
  }

  /** The key never lands in a row, even if a provider echoes it back (AI-004). */
  private redact(message: string): string {
    const key = this.config.geminiApiKey;
    return key ? message.split(key).join('[redacted]') : message;
  }

  private static toJsonSchema(schema: z.ZodType): Record<string, unknown> {
    const { $schema: _, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
    return jsonSchema;
  }

  private static parse<T>(text: string, schema: z.ZodType<T>, finishReason: string | null): T {
    // A cut-off answer is the common cause of broken JSON, so the reason goes into the message.
    const cutOff = finishReason && finishReason !== 'STOP' ? ` (finish reason ${finishReason})` : '';
    if (!text) throw new AiCallError('invalid-output', `Empty answer${cutOff}`);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new AiCallError('invalid-output', `The answer is not JSON${cutOff}`);
    }
    const result = schema.safeParse(json);
    if (!result.success) {
      throw new AiCallError('invalid-output', z.prettifyError(result.error));
    }
    return result.data;
  }
}
