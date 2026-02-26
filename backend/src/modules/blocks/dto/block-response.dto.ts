import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockType } from '../../../database/entities/block.entity.js';

export class BlockResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: BlockType })
  type!: BlockType;

  @ApiProperty()
  pageId!: string;

  @ApiPropertyOptional()
  parentBlockId!: string | null;

  @ApiProperty()
  content!: Record<string, unknown>;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
