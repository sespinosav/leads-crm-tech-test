import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LeadsModule } from '../leads/leads.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LLM_PROVIDER, LlmProvider } from './llm-provider.interface';
import { MockLlmProvider } from './providers/mock.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [LeadsModule],
  controllers: [AiController],
  providers: [
    AiService,
    MockLlmProvider,
    {
      // Pick the real OpenAI provider when an API key is configured, fall
      // back to the deterministic mock otherwise.
      provide: LLM_PROVIDER,
      inject: [ConfigService, MockLlmProvider],
      useFactory: (config: ConfigService, mock: MockLlmProvider): LlmProvider => {
        const key = config.get<string>('OPENAI_API_KEY');
        return key && key.trim().length > 0
          ? new OpenAiProvider(config)
          : mock;
      },
    },
  ],
})
export class AiModule {}
