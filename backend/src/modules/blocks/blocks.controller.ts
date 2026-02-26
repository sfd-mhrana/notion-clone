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
import { BlocksService } from './blocks.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import {
  CreateBlockDto,
  UpdateBlockDto,
  MoveBlockDto,
  BlockResponseDto,
} from './dto/index.js';

@ApiTags('Blocks')
@ApiBearerAuth()
@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get('pages/:pageId/blocks')
  @ApiOperation({ summary: 'Get all blocks for a page' })
  @ApiResponse({ status: 200, type: [BlockResponseDto] })
  async getBlocksForPage(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @CurrentUser('id') userId: string,
  ): Promise<BlockResponseDto[]> {
    return this.blocksService.getBlocksForPage(pageId, userId);
  }

  @Post('pages/:pageId/blocks')
  @ApiOperation({ summary: 'Create a new block in a page' })
  @ApiResponse({ status: 201, type: BlockResponseDto })
  async create(
    @Param('pageId', ParseUUIDPipe) pageId: string,
    @Body() dto: CreateBlockDto,
    @CurrentUser('id') userId: string,
  ): Promise<BlockResponseDto> {
    return this.blocksService.create(pageId, dto, userId);
  }

  @Patch('blocks/:id')
  @ApiOperation({ summary: 'Update block content' })
  @ApiResponse({ status: 200, type: BlockResponseDto })
  @ApiResponse({ status: 404, description: 'Block not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlockDto,
    @CurrentUser('id') userId: string,
  ): Promise<BlockResponseDto> {
    return this.blocksService.update(id, dto, userId);
  }

  @Delete('blocks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a block and its children' })
  @ApiResponse({ status: 204, description: 'Block deleted successfully' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.blocksService.delete(id, userId);
  }

  @Patch('blocks/:id/move')
  @ApiOperation({ summary: 'Move a block to a different parent or page' })
  @ApiResponse({ status: 200, type: BlockResponseDto })
  async move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveBlockDto,
    @CurrentUser('id') userId: string,
  ): Promise<BlockResponseDto> {
    return this.blocksService.move(id, dto, userId);
  }
}
