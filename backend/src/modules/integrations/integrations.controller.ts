import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service.js';
import type { ExportFormat } from './export.service.js';
import { ImportService, ImportFormat } from './import.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface JwtUser {
  sub: string;
  email: string;
}

class ImportDto {
  content!: string;
  format!: ImportFormat;
  workspaceId!: string;
  parentPageId?: string;
}

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('api/integrations')
export class IntegrationsController {
  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService,
  ) {}

  @Get('export/page/:pageId')
  @ApiOperation({ summary: 'Export a page' })
  @ApiResponse({ status: 200, description: 'Returns exported content' })
  async exportPage(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Query('format') format: ExportFormat = 'markdown',
    @Query('includeSubpages') includeSubpages = false,
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportService.exportPage(pageId, user.sub, {
      format,
      includeSubpages,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }

  @Get('export/workspace/:workspaceId')
  @ApiOperation({ summary: 'Export entire workspace' })
  @ApiResponse({ status: 200, description: 'Returns exported workspace data' })
  async exportWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query('format') format: ExportFormat = 'json',
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportService.exportWorkspace(workspaceId, user.sub, {
      format,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import content' })
  @ApiResponse({ status: 201, description: 'Import completed' })
  async importContent(
    @Body() dto: ImportDto,
    @CurrentUser() user: JwtUser,
  ): Promise<{ pagesCreated: number; blocksCreated: number; errors: string[] }> {
    return this.importService.importContent(dto.content, user.sub, {
      format: dto.format,
      workspaceId: dto.workspaceId,
      parentPageId: dto.parentPageId,
    });
  }
}
