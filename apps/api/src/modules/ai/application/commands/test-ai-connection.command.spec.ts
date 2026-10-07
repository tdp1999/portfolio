import { AiCallError } from '../ai-call.error';
import type { AiConfig } from '../ai.config';
import type { IAiClient } from '../ports/ai-client.port';
import { TestAiConnectionCommand, TestAiConnectionHandler } from './test-ai-connection.command';

describe('TestAiConnectionHandler', () => {
  const config: AiConfig = {
    apiKey: 'k',
    billing: 'free',
    defaultModel: 'gemini-3.5-flash-lite',
    dailyCapMicroUsd: 1_000_000,
  };
  let ai: jest.Mocked<IAiClient>;
  const handler = () => new TestAiConnectionHandler(config, ai);

  beforeEach(() => {
    ai = {
      configured: true,
      provider: 'gemini',
      billing: 'free',
      generateStructured: jest.fn(),
      spentMicroUsd: jest.fn(),
      spentByGroup: jest.fn(),
    };
  });

  it('should refuse a model id that is not one, without calling the model', async () => {
    const result = await handler().execute(new TestAiConnectionCommand({ model: 'x; rm -rf' }));

    expect(result).toMatchObject({ ok: false, errorKind: 'refused' });
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it('should turn an AI call error into an answer naming the model and the reason', async () => {
    ai.generateStructured.mockRejectedValue(new AiCallError('unavailable', 'high demand'));

    const result = await handler().execute(new TestAiConnectionCommand({}));

    expect(result).toEqual({
      ok: false,
      model: 'gemini-3.5-flash-lite',
      errorKind: 'unavailable',
      message: 'high demand',
    });
  });

  it('should let an unexpected error through as an error', async () => {
    ai.generateStructured.mockRejectedValue(new TypeError('bug'));

    await expect(handler().execute(new TestAiConnectionCommand({}))).rejects.toBeInstanceOf(TypeError);
  });
});
