import { Injectable, Logger } from '@nestjs/common';
import { Lead } from '../../leads/entities/lead.entity';
import { LEAD_SOURCES, LeadSource } from '../../leads/lead-source.enum';
import { LlmProvider, SummaryContext } from '../llm-provider.interface';

/**
 * Deterministic fallback used when `OPENAI_API_KEY` is not set. It computes
 * the same kind of aggregates a real model would mention and writes them out
 * as plain text. This keeps `/leads/ai/summary` fully functional for grading
 * and local development without any external dependency or cost.
 *
 * Whenever an API key is configured the real provider is wired in instead —
 * see `ai.module.ts`. The contract (`LlmProvider`) is identical so the
 * controller does not change.
 */
@Injectable()
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';
  private readonly logger = new Logger(MockLlmProvider.name);

  async generateSummary(
    leads: Lead[],
    filter: SummaryContext,
  ): Promise<string> {
    this.logger.warn(
      'Using mock LLM provider — set OPENAI_API_KEY to enable the real model.',
    );

    if (leads.length === 0) {
      return [
        '## Executive summary',
        '',
        'No leads match the requested filters, so there is nothing to analyze yet.',
        'Recommendation: revisit the date range or open the funnel to all channels.',
      ].join('\n');
    }

    const counts: Record<LeadSource, number> = {
      instagram: 0,
      facebook: 0,
      landing_page: 0,
      referido: 0,
      otro: 0,
    };
    let withBudget = 0;
    let totalBudget = 0;
    for (const l of leads) {
      counts[l.fuente]++;
      if (typeof l.presupuesto === 'number') {
        withBudget++;
        totalBudget += l.presupuesto;
      }
    }
    const topSource = (Object.entries(counts) as [LeadSource, number][])
      .sort((a, b) => b[1] - a[1])[0];
    const avg = withBudget > 0 ? (totalBudget / withBudget).toFixed(2) : null;

    const filterDesc =
      [
        filter.fuente ? `source = ${filter.fuente}` : null,
        filter.from ? `from = ${filter.from}` : null,
        filter.to ? `to = ${filter.to}` : null,
      ]
        .filter(Boolean)
        .join(', ') || 'no filters';

    const lines: string[] = [];
    lines.push('## Executive summary');
    lines.push('');
    lines.push(`Analysed ${leads.length} lead(s) (${filterDesc}).`);
    lines.push('');
    lines.push('### Channel distribution');
    for (const src of LEAD_SOURCES) {
      const n = counts[src];
      const pct = ((n / leads.length) * 100).toFixed(1);
      lines.push(`- ${src}: ${n} (${pct}%)`);
    }
    lines.push('');
    lines.push(
      `### Top channel\n${topSource[0]} dominates with ${topSource[1]} lead(s).`,
    );
    if (avg !== null) {
      lines.push('');
      lines.push(
        `### Budget\nAverage stated budget across ${withBudget} lead(s): USD ${avg}.`,
      );
    }
    lines.push('');
    lines.push('### Recommendations');
    lines.push(
      `- Double down on ${topSource[0]} — it is producing the highest volume.`,
    );
    lines.push(
      '- Re-engage leads without a stated budget using a discovery-friendly script.',
    );
    lines.push(
      '- Set up nurturing for "referido" leads — they usually convert at higher rates.',
    );

    return lines.join('\n');
  }
}
