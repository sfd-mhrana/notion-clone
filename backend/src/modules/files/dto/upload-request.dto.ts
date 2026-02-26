import { IsString, IsNumber, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

export class UploadRequestDto {
  @ApiProperty({ description: 'Original filename' })
  @IsString()
  filename!: string;

  @ApiProperty({
    description: 'MIME content type',
    enum: ALLOWED_CONTENT_TYPES,
  })
  @IsString()
  @IsIn(ALLOWED_CONTENT_TYPES)
  contentType!: string;

  @ApiProperty({ description: 'File size in bytes', maximum: 104857600 }) // 100MB
  @IsNumber()
  @Max(104857600) // 100MB max
  fileSize!: number;

  @ApiProperty({ description: 'Workspace ID for the file' })
  @IsString()
  workspaceId!: string;
}
