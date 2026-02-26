import { IsString, IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Template content (blocks and properties)' })
  @IsObject()
  content!: {
    blocks: unknown[];
    properties?: unknown[];
  };

  @ApiPropertyOptional({ description: 'Whether template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Workspace ID (for workspace-specific templates)' })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template icon (emoji)' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Template content' })
  @IsOptional()
  @IsObject()
  content?: {
    blocks: unknown[];
    properties?: unknown[];
  };

  @ApiPropertyOptional({ description: 'Whether template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class TemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  coverImage?: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  content!: {
    blocks: unknown[];
    properties?: unknown[];
  };

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  usageCount!: number;

  @ApiPropertyOptional()
  workspaceId?: string;

  @ApiProperty()
  createdById!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
