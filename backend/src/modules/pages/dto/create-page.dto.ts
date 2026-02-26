import { IsString, IsUUID, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiPropertyOptional({ example: 'My New Page', default: 'Untitled' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ example: '📝' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent page ID for nested pages' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
