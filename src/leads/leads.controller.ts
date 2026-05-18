import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new lead' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with pagination + filters' })
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  // IMPORTANT: declare /stats BEFORE /:id so the static segment wins.
  @Get('stats')
  @ApiOperation({ summary: 'Aggregated lead statistics' })
  stats() {
    return this.leadsService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lead by ID' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead fields' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a lead' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.leadsService.remove(id);
  }
}
