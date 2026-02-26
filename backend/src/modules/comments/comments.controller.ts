import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto/index.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('page/:pageId')
  @ApiOperation({ summary: 'Get comments for a page' })
  @ApiResponse({ status: 200, description: 'Returns list of comments' })
  async findByPage(
    @Param('pageId', ParseUUIDPipe) pageId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findByPage(pageId);
  }

  @Get('block/:blockId')
  @ApiOperation({ summary: 'Get comments for a block' })
  @ApiResponse({ status: 200, description: 'Returns list of comments' })
  async findByBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
  ): Promise<CommentResponseDto[]> {
    return this.commentsService.findByBlock(blockId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  async create(
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: JwtUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<void> {
    return this.commentsService.delete(id, user.sub);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a comment' })
  @ApiResponse({ status: 200, description: 'Comment resolved' })
  async resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ): Promise<CommentResponseDto> {
    return this.commentsService.resolve(id, user.sub);
  }

  @Post(':id/unresolve')
  @ApiOperation({ summary: 'Unresolve a comment' })
  @ApiResponse({ status: 200, description: 'Comment unresolved' })
  async unresolve(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentResponseDto> {
    return this.commentsService.unresolve(id);
  }
}
