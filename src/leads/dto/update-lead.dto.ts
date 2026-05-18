import { PartialType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';

// PATCH /leads/:id — every field becomes optional via PartialType, keeping
// the same validation rules for the fields that are present.
export class UpdateLeadDto extends PartialType(CreateLeadDto) {}
