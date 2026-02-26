import { IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlockType } from '../../../database/entities/block.entity.js';

export class UpdateBlockDto {
  @ApiPropertyOptional({ enum: BlockType })
  @IsOptional()
  @IsEnum(BlockType)
  type?: BlockType;

  @ApiPropertyOptional({ description: 'Block content as JSON' })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
