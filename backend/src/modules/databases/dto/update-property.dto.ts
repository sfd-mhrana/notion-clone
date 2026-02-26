import { IsString, IsEnum, IsOptional, IsObject, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType } from '../../../database/entities/database-property.entity.js';

export class UpdatePropertyDto {
  @ApiPropertyOptional({ example: 'Updated Name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ enum: PropertyType })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ description: 'Configuration for the property' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
