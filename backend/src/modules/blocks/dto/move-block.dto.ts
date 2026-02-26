import { IsUUID, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MoveBlockDto {
  @ApiPropertyOptional({ description: 'New parent block ID (null for root level)' })
  @IsOptional()
  @IsUUID()
  parentBlockId?: string | null;

  @ApiPropertyOptional({ description: 'New page ID (for moving between pages)' })
  @IsOptional()
  @IsUUID()
  pageId?: string;

  @ApiPropertyOptional({ description: 'New order position' })
  @IsOptional()
  @IsNumber()
  order?: number;
}
