import { IsString, IsUUID, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  q!: string;

  @ApiProperty({ description: 'Workspace ID to search in' })
  @IsUUID()
  workspaceId!: string;

  @ApiPropertyOptional({
    description: 'Types to search (page, block)',
    example: ['page', 'block'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  types?: ('page' | 'block')[];

  @ApiPropertyOptional({ description: 'Maximum number of results', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number;
}
