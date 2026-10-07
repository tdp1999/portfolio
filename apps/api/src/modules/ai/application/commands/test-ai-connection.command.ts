import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';

import { AiCallError } from '../ai-call.error';
import { AI_CLIENT, AI_CONFIG } from '../ai.token';
import type { AiConfig } from '../ai.config';
import { AiTestResultDto } from '../ai.dto';
import type { IAiClient } from '../ports/ai-client.port';

/** One minimal call, so the Owner sees whether the key and a model work. `model` defaults to the configured one. */
export class TestAiConnectionCommand {
  constructor(readonly body: unknown = {}) {}
}

@CommandHandler(TestAiConnectionCommand)
export class TestAiConnectionHandler implements ICommandHandler<TestAiConnectionCommand> {
  private static readonly SCHEMA = z.object({ ok: z.boolean() });
  private static readonly INPUT = z.object({
    model: z
      .string()
      .regex(/^[a-z0-9.-]{1,100}$/)
      .optional(),
  });
  /** Room for the model's thinking as well as the answer: thinking counts against this cap. */
  private static readonly MAX_OUTPUT_TOKENS = 1024;
  /** Under the console's 30 s request timeout, so a slow model still answers with a reason. */
  private static readonly TIMEOUT_MS = 25_000;

  constructor(
    @Inject(AI_CONFIG) private readonly config: AiConfig,
    @Inject(AI_CLIENT) private readonly ai: IAiClient
  ) {}

  /** A failed test is an answer, not an error: the console shows the provider's reason. */
  async execute(command: TestAiConnectionCommand): Promise<AiTestResultDto> {
    const input = TestAiConnectionHandler.INPUT.safeParse(command.body ?? {});
    if (!input.success) {
      return { ok: false, model: this.config.defaultModel, errorKind: 'refused', message: 'Not a model id' };
    }
    const model = input.data.model ?? this.config.defaultModel;
    try {
      const result = await this.ai.generateStructured({
        model,
        system: 'You check that an API connection works.',
        parts: [{ text: 'Answer with {"ok": true}.' }],
        schema: TestAiConnectionHandler.SCHEMA,
        feature: 'ai.test',
        limits: {
          maxOutputTokens: TestAiConnectionHandler.MAX_OUTPUT_TOKENS,
          timeoutMs: TestAiConnectionHandler.TIMEOUT_MS,
        },
      });
      return { ok: true, model: result.model, latencyMs: result.latencyMs };
    } catch (err) {
      if (!(err instanceof AiCallError)) throw err;
      return { ok: false, model, errorKind: err.kind, message: err.message };
    }
  }
}
