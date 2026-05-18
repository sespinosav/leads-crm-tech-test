import { Lead } from '../leads/entities/lead.entity';

/**
 * Provider abstraction so the rest of the app does not depend on any specific
 * LLM SDK. Real implementations (OpenAI, Anthropic, Bedrock, etc.) and the
 * built-in mock both satisfy this contract.
 */
export interface LlmProvider {
  readonly name: string;
  generateSummary(leads: Lead[], filter: SummaryContext): Promise<string>;
}

export interface SummaryContext {
  fuente?: string;
  from?: string;
  to?: string;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
