import { IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../../../database/entities/database-property.entity.js';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Status' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ enum: PropertyType, default: PropertyType.TEXT })
  @IsEnum(PropertyType)
  type!: PropertyType;

  @ApiPropertyOptional({
    description: 'Configuration for the property (e.g., select options)',
    example: { options: [{ id: '1', name: 'To Do', color: 'red' }] },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
