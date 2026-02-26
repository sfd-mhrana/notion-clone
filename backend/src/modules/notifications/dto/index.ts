import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity.js';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID to notify' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Notification message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Additional data' })
  @IsOptional()
  @IsObject()
  data?: {
    pageId?: string;
    blockId?: string;
    commentId?: string;
    workspaceId?: string;
    actorId?: string;
    actorName?: string;
  };

  @ApiPropertyOptional({ description: 'Link URL' })
  @IsOptional()
  @IsString()
  link?: string;
}

export class NotificationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  data?: {
    pageId?: string;
    blockId?: string;
    commentId?: string;
    workspaceId?: string;
    actorId?: string;
    actorName?: string;
  };

  @ApiProperty()
  read!: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiPropertyOptional()
  link?: string;

  @ApiProperty()
  createdAt!: Date;
}
