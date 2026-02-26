import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FilesService } from './files.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UploadRequestDto, UploadResponseDto } from './dto/index.js';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Get a presigned URL for file upload' })
  @ApiResponse({ status: 200, type: UploadResponseDto })
  async getUploadUrl(
    @Body() dto: UploadRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<UploadResponseDto> {
    return this.filesService.getUploadUrl(dto, userId);
  }

  @Delete(':fileKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a file from storage' })
  @ApiResponse({ status: 204, description: 'File deleted successfully' })
  async deleteFile(
    @Param('fileKey') fileKey: string,
    @Query('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.filesService.deleteFile(fileKey, userId, workspaceId);
  }
}
