import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Lead } from '../../leads/entities/lead.entity';
import { LlmProvider, SummaryContext } from '../llm-provider.interface';
import { buildSummaryPrompt } from '../prompt';

/**
 * Real LLM integration through the OpenAI SDK. Activated when `OPENAI_API_KEY`
 * is present in the environment. The same interface is satisfied by
 * `MockLlmProvider` so swapping providers — or vendor — is a one-line change
 * in `ai.module.ts`.
 */
@Injectable()
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
    this.model = config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async generateSummary(leads: Lead[], filter: SummaryContext): Promise<string> {
    const { system, user } = buildSummaryPrompt(leads, filter);
    this.logger.log(
      `Requesting summary from ${this.model} (${leads.length} leads)`,
    );

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
  }
}
