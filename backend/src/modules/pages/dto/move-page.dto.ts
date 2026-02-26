import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MovePageDto {
  @ApiPropertyOptional({ description: 'New parent page ID (null for root level)' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'New workspace ID (for moving between workspaces)' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiPropertyOptional({ description: 'New order position' })
  @IsOptional()
  order?: string;
}
