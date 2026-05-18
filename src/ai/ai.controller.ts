import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { AiService } from './ai.service';
import { SummaryFilterDto } from './dto/summary-filter.dto';

@ApiTags('ai')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('leads/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary')
  @ApiOperation({ summary: 'AI-generated executive summary of leads' })
  summary(@Body() filter: SummaryFilterDto) {
    return this.aiService.summary(filter);
  }
}
