import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { UploadRequestDto, UploadResponseDto } from './dto/index.js';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly workspacesService: WorkspacesService,
  ) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');

    this.bucket = this.configService.get<string>('S3_BUCKET', 'notely');
    this.endpoint = endpoint || `https://s3.${region}.amazonaws.com`;

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint, // Required for MinIO
    });
  }

  async getUploadUrl(
    dto: UploadRequestDto,
    userId: string,
  ): Promise<UploadResponseDto> {
    this.logger.debug(`Generating upload URL for ${dto.filename}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(dto.workspaceId, userId);

    // Generate unique file key
    const extension = dto.filename.split('.').pop() || '';
    const fileKey = `${dto.workspaceId}/${uuidv4()}.${extension}`;

    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: dto.contentType,
      ContentLength: dto.fileSize,
      Metadata: {
        'original-filename': dto.filename,
        'uploaded-by': userId,
        'workspace-id': dto.workspaceId,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Construct public URL
    const publicUrl = `${this.endpoint}/${this.bucket}/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      publicUrl,
    };
  }

  async getDownloadUrl(
    fileKey: string,
    userId: string,
    workspaceId: string,
  ): Promise<string> {
    this.logger.debug(`Generating download URL for ${fileKey}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });
  }

  async deleteFile(
    fileKey: string,
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    this.logger.debug(`Deleting file ${fileKey}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileKey}:`, error);
      throw new NotFoundException('File not found');
    }
  }
}
