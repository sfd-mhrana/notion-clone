import { IsEnum, IsUUID, IsOptional, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockType } from '../../../database/entities/block.entity.js';

export class CreateBlockDto {
  @ApiProperty({ enum: BlockType, default: BlockType.PARAGRAPH })
  @IsEnum(BlockType)
  type!: BlockType;

  @ApiPropertyOptional({ description: 'Parent block ID for nested blocks' })
  @IsOptional()
  @IsUUID()
  parentBlockId?: string;

  @ApiPropertyOptional({ description: 'Block content as JSON' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Position order (auto-calculated if not provided)' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
