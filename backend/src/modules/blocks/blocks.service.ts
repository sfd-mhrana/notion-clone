import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from '../../database/entities/block.entity.js';
import { Page } from '../../database/entities/page.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import {
  CreateBlockDto,
  UpdateBlockDto,
  MoveBlockDto,
  BlockResponseDto,
} from './dto/index.js';

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getBlocksForPage(pageId: string, userId: string): Promise<BlockResponseDto[]> {
    this.logger.debug(`Getting blocks for page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    const blocks = await this.blockRepository.find({
      where: { pageId },
      order: { order: 'ASC' },
    });

    return blocks.map((block) => this.mapToDto(block));
  }

  async create(
    pageId: string,
    dto: CreateBlockDto,
    userId: string,
  ): Promise<BlockResponseDto> {
    this.logger.debug(`Creating block in page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    // Calculate order if not provided
    let order = dto.order;
    if (order === undefined) {
      const maxOrderResult = await this.blockRepository
        .createQueryBuilder('block')
        .select('MAX(block.order)', 'maxOrder')
        .where('block.pageId = :pageId', { pageId })
        .andWhere(
          dto.parentBlockId
            ? 'block.parentBlockId = :parentBlockId'
            : 'block.parentBlockId IS NULL',
          { parentBlockId: dto.parentBlockId },
        )
        .getRawOne();

      order = (maxOrderResult?.maxOrder ?? 0) + 1;
    }

    const block = this.blockRepository.create({
      type: dto.type,
      pageId,
      parentBlockId: dto.parentBlockId || null,
      content: dto.content || {},
      order,
      createdById: userId,
    });

    await this.blockRepository.save(block);

    return this.mapToDto(block);
  }

  async update(
    blockId: string,
    dto: UpdateBlockDto,
    userId: string,
  ): Promise<BlockResponseDto> {
    this.logger.debug(`Updating block: ${blockId}`);

    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['page'],
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.page.isDeleted) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(block.page.workspaceId, userId);

    if (dto.type !== undefined) {
      block.type = dto.type;
    }

    if (dto.content !== undefined) {
      block.content = dto.content;
    }

    await this.blockRepository.save(block);

    return this.mapToDto(block);
  }

  async delete(blockId: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting block: ${blockId}`);

    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['page'],
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.page.isDeleted) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(block.page.workspaceId, userId);

    // Delete block and all its children recursively
    await this.deleteRecursive(blockId);
  }

  async move(
    blockId: string,
    dto: MoveBlockDto,
    userId: string,
  ): Promise<BlockResponseDto> {
    this.logger.debug(`Moving block: ${blockId}`);

    const block = await this.blockRepository.findOne({
      where: { id: blockId },
      relations: ['page'],
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    if (block.page.isDeleted) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to current workspace
    await this.workspacesService.getMemberRole(block.page.workspaceId, userId);

    // If moving to a different page, verify access
    if (dto.pageId && dto.pageId !== block.pageId) {
      const targetPage = await this.pageRepository.findOne({
        where: { id: dto.pageId, isDeleted: false },
      });

      if (!targetPage) {
        throw new NotFoundException('Target page not found');
      }

      await this.workspacesService.getMemberRole(targetPage.workspaceId, userId);
      block.pageId = dto.pageId;
    }

    // Prevent circular references
    if (dto.parentBlockId) {
      const isDescendant = await this.isDescendant(dto.parentBlockId, blockId);
      if (isDescendant) {
        throw new ForbiddenException('Cannot move a block into its own descendant');
      }
      block.parentBlockId = dto.parentBlockId;
    } else if (dto.parentBlockId === null) {
      block.parentBlockId = null;
    }

    if (dto.order !== undefined) {
      block.order = dto.order;
    }

    await this.blockRepository.save(block);

    return this.mapToDto(block);
  }

  private async deleteRecursive(blockId: string): Promise<void> {
    // First delete all children
    const children = await this.blockRepository.find({
      where: { parentBlockId: blockId },
    });

    for (const child of children) {
      await this.deleteRecursive(child.id);
    }

    // Then delete the block itself
    await this.blockRepository.delete(blockId);
  }

  private async isDescendant(potentialParentId: string, blockId: string): Promise<boolean> {
    if (potentialParentId === blockId) {
      return true;
    }

    const potentialParent = await this.blockRepository.findOne({
      where: { id: potentialParentId },
    });

    if (!potentialParent?.parentBlockId) {
      return false;
    }

    return this.isDescendant(potentialParent.parentBlockId, blockId);
  }

  private mapToDto(block: Block): BlockResponseDto {
    return {
      id: block.id,
      type: block.type,
      pageId: block.pageId,
      parentBlockId: block.parentBlockId,
      content: block.content,
      order: block.order,
      createdById: block.createdById,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
  }
}
