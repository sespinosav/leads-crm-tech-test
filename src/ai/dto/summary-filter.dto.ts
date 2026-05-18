import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { LEAD_SOURCES, LeadSource } from '../../leads/lead-source.enum';

export class SummaryFilterDto {
  @ApiPropertyOptional({ enum: LEAD_SOURCES })
  @IsOptional()
  @IsEnum(LEAD_SOURCES)
  fuente?: LeadSource;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
