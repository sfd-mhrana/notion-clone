import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PagesService } from './pages.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreatePageDto,
  UpdatePageDto,
  MovePageDto,
  PageResponseDto,
  PageTreeNodeDto,
  TrashPageDto,
} from './dto/index.js';

@ApiTags('Pages')
@ApiBearerAuth()
@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('workspaces/:workspaceId/pages')
  @ApiOperation({ summary: 'Get page tree for a workspace' })
  @ApiResponse({ status: 200, type: [PageTreeNodeDto] })
  async getPageTree(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<PageTreeNodeDto[]> {
    return this.pagesService.getPageTree(workspaceId, userId);
  }

  @Post('workspaces/:workspaceId/pages')
  @ApiOperation({ summary: 'Create a new page' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreatePageDto,
    @CurrentUser('id') userId: string,
  ): Promise<PageResponseDto> {
    return this.pagesService.create(workspaceId, dto, userId);
  }

  @Get('workspaces/:workspaceId/trash')
  @ApiOperation({ summary: 'Get deleted pages in trash' })
  @ApiResponse({ status: 200, type: [TrashPageDto] })
  async getTrash(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<TrashPageDto[]> {
    return this.pagesService.getTrash(workspaceId, userId);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'Get a page with its blocks' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Page not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pagesService.getPageWithBlocks(id, userId);
  }

  @Patch('pages/:id')
  @ApiOperation({ summary: 'Update page details' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser('id') userId: string,
  ): Promise<PageResponseDto> {
    return this.pagesService.update(id, dto, userId);
  }

  @Delete('pages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a page' })
  @ApiResponse({ status: 204, description: 'Page moved to trash' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.pagesService.delete(id, userId);
  }

  @Post('pages/:id/restore')
  @ApiOperation({ summary: 'Restore a page from trash' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PageResponseDto> {
    return this.pagesService.restore(id, userId);
  }

  @Post('pages/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a page with all its blocks' })
  @ApiResponse({ status: 201, type: PageResponseDto })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<PageResponseDto> {
    return this.pagesService.duplicate(id, userId);
  }

  @Patch('pages/:id/move')
  @ApiOperation({ summary: 'Move a page to a different parent or workspace' })
  @ApiResponse({ status: 200, type: PageResponseDto })
  async move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MovePageDto,
    @CurrentUser('id') userId: string,
  ): Promise<PageResponseDto> {
    return this.pagesService.move(id, dto, userId);
  }
}
