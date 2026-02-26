import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Workspace' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ example: '🏠' })
  @IsOptional()
  @IsString()
  iconEmoji?: string;
}
