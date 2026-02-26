import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'Presigned URL for uploading the file' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Unique file key in S3' })
  fileKey!: string;

  @ApiProperty({ description: 'Public URL to access the file after upload' })
  publicUrl!: string;
}
