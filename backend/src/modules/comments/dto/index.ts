import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  content!: string;

  @ApiProperty({ description: 'Page ID' })
  @IsUUID()
  pageId!: string;

  @ApiPropertyOptional({ description: 'Block ID (for inline comments)' })
  @IsOptional()
  @IsUUID()
  blockId?: string;

  @ApiPropertyOptional({ description: 'Parent comment ID (for replies)' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated content' })
  @IsString()
  content!: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  pageId!: string;

  @ApiPropertyOptional()
  blockId?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  author?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };

  @ApiProperty()
  resolved!: boolean;

  @ApiPropertyOptional()
  resolvedById?: string;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional({ type: () => [CommentResponseDto] })
  replies?: CommentResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
