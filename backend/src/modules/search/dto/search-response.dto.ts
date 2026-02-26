import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty({ enum: ['page', 'block'] })
  type!: 'page' | 'block';

  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  snippet?: string;

  @ApiPropertyOptional({ description: 'Page ID (for block results)' })
  pageId?: string;

  @ApiPropertyOptional({ description: 'Page title (for block results)' })
  pageTitle?: string;

  @ApiProperty()
  workspaceId!: string;
}

export class SearchResponseDto {
  @ApiProperty({ type: [SearchResultDto] })
  results!: SearchResultDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  query!: string;
}
