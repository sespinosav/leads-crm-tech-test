import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { LEAD_SOURCES, LeadSource } from '../lead-source.enum';

export class CreateLeadDto {
  @ApiProperty({ minLength: 2, example: 'Juan Pérez' })
  @IsString()
  @MinLength(2, { message: 'nombre must be at least 2 characters long' })
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @ApiPropertyOptional({ example: '+57 300 1234567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: LEAD_SOURCES, example: 'instagram' })
  @IsEnum(LEAD_SOURCES, {
    message: `fuente must be one of: ${LEAD_SOURCES.join(', ')}`,
  })
  fuente!: LeadSource;

  @ApiPropertyOptional({ example: 'Curso de copywriting' })
  @IsOptional()
  @IsString()
  productoInteres?: string;

  @ApiPropertyOptional({ example: 500, description: 'Budget in USD' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  presupuesto?: number;
}
