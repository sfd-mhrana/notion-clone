import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity.js';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto } from './dto/index.js';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findByPage(pageId: string): Promise<CommentResponseDto[]> {
    this.logger.debug(`Fetching comments for page: ${pageId}`);

    const comments = await this.commentRepository.find({
      where: { pageId, parentId: undefined },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
    });

    return comments.map(c => this.mapToDto(c));
  }

  async findByBlock(blockId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentRepository.find({
      where: { blockId, parentId: undefined },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
    });

    return comments.map(c => this.mapToDto(c));
  }

  async create(dto: CreateCommentDto, userId: string): Promise<CommentResponseDto> {
    this.logger.debug(`Creating comment on page: ${dto.pageId}`);

    const comment = this.commentRepository.create({
      content: dto.content,
      pageId: dto.pageId,
      blockId: dto.blockId,
      parentId: dto.parentId,
      authorId: userId,
    });

    await this.commentRepository.save(comment);

    // Reload with relations
    const saved = await this.commentRepository.findOne({
      where: { id: comment.id },
      relations: ['author'],
    });

    return this.mapToDto(saved!);
  }

  async update(
    id: string,
    dto: UpdateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    await this.commentRepository.save(comment);

    return this.mapToDto(comment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete(id);
  }

  async resolve(id: string, userId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.resolved = true;
    comment.resolvedById = userId;
    comment.resolvedAt = new Date();

    await this.commentRepository.save(comment);
    return this.mapToDto(comment);
  }

  async unresolve(id: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.resolved = false;
    comment.resolvedById = undefined;
    comment.resolvedAt = undefined;

    await this.commentRepository.save(comment);
    return this.mapToDto(comment);
  }

  private mapToDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      pageId: comment.pageId,
      blockId: comment.blockId,
      parentId: comment.parentId,
      author: comment.author ? {
        id: comment.author.id,
        name: comment.author.name,
        avatarUrl: comment.author.avatarUrl,
      } : undefined,
      resolved: comment.resolved,
      resolvedById: comment.resolvedById,
      resolvedAt: comment.resolvedAt,
      replies: comment.replies?.map(r => this.mapToDto(r)),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }
}
