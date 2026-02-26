import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePageDto {
  @ApiPropertyOptional({ example: 'Updated Page Title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({ example: '🚀' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-cover' })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
