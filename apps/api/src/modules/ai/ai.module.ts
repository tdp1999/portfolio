import { Logger, Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';

import { AiClientService } from './application/ai-client.service';
import { AiConfig, loadAiConfig } from './application/ai.config';
import { AI_CLIENT, AI_CONFIG, AI_PROVIDER, AI_USAGE_REPOSITORY } from './application/ai.token';
import { TestAiConnectionHandler } from './application/commands';
import { GetAiStatusHandler, GetAiUsageHandler, ListAiCallsHandler } from './application/queries';
import { AiUsageRepository } from './infrastructure/ai-usage.repository';
import { GeminiProvider } from './infrastructure/gemini.provider';
import { AiAdminController } from './presentation/ai-admin.controller';

/** AI integration: one provider (Gemini), the usage ledger, and the admin status/test routes. */
@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule)],
  controllers: [AiAdminController],
  providers: [
    {
      provide: AI_CONFIG,
      useFactory: () => {
        const config = loadAiConfig();
        if (!config.geminiApiKey) {
          new Logger('AiModule').warn('GEMINI_API_KEY is unset; AI calls are refused, the rest of the app still works');
        }
        return config;
      },
    },
    {
      provide: AI_PROVIDER,
      inject: [AI_CONFIG],
      useFactory: (config: AiConfig) => new GeminiProvider(config.geminiApiKey),
    },
    { provide: AI_USAGE_REPOSITORY, useClass: AiUsageRepository },
    { provide: AI_CLIENT, useClass: AiClientService },
    TestAiConnectionHandler,
    GetAiStatusHandler,
    GetAiUsageHandler,
    ListAiCallsHandler,
  ],
  exports: [AI_CLIENT],
})
export class AiModule {}
