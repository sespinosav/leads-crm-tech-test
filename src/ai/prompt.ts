import { Lead } from '../leads/entities/lead.entity';
import { SummaryContext } from './llm-provider.interface';

/**
 * Build the system+user prompt used by any LLM provider. Centralising it
 * makes prompt tuning a single-file change and keeps providers thin.
 */
export function buildSummaryPrompt(
  leads: Lead[],
  filter: SummaryContext,
): { system: string; user: string } {
  const system = [
    'You are a senior marketing analyst.',
    'Write a concise executive summary in English for the marketing team.',
    'The summary MUST include:',
    '1. A general analysis of the leads.',
    '2. The dominant acquisition channel.',
    '3. Three actionable recommendations.',
    'Use short paragraphs and Markdown headings. Avoid filler.',
  ].join('\n');

  // We send a compact JSON-like payload — cheaper on tokens than a CSV and
  // easier for the model to reason about than free-form prose.
  const payload = leads.map((l) => ({
    fuente: l.fuente,
    productoInteres: l.productoInteres,
    presupuesto: l.presupuesto,
    createdAt: l.createdAt.toISOString(),
  }));

  const filterDesc = JSON.stringify(filter);

  const user = [
    `Filters applied: ${filterDesc}`,
    `Total leads in the dataset: ${leads.length}`,
    'Dataset (one lead per row):',
    JSON.stringify(payload),
  ].join('\n');

  return { system, user };
}
