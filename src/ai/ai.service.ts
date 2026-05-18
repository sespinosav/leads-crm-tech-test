import { Inject, Injectable } from '@nestjs/common';
import { LeadsService } from '../leads/leads.service';
import { SummaryFilterDto } from './dto/summary-filter.dto';
import { LLM_PROVIDER, LlmProvider } from './llm-provider.interface';

@Injectable()
export class AiService {
  constructor(
    private readonly leadsService: LeadsService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async summary(filter: SummaryFilterDto) {
    const leads = await this.leadsService.findForReport(filter);
    const text = await this.llm.generateSummary(leads, filter);
    return {
      provider: this.llm.name,
      filter,
      leadsAnalyzed: leads.length,
      generatedAt: new Date().toISOString(),
      summary: text,
    };
  }
}
