import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { Block } from '../../database/entities/block.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import {
  CreatePageDto,
  UpdatePageDto,
  MovePageDto,
  PageResponseDto,
  PageTreeNodeDto,
  TrashPageDto,
} from './dto/index.js';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async getPageTree(workspaceId: string, userId: string): Promise<PageTreeNodeDto[]> {
    this.logger.debug(`Getting page tree for workspace: ${workspaceId}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const pages = await this.pageRepository.find({
      where: {
        workspaceId,
        isDeleted: false,
      },
      order: { order: 'ASC' },
    });

    return this.buildTree(pages);
  }

  async create(
    workspaceId: string,
    dto: CreatePageDto,
    userId: string,
  ): Promise<PageResponseDto> {
    this.logger.debug(`Creating page in workspace: ${workspaceId}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    // Get max order for siblings
    const maxOrderResult = await this.pageRepository
      .createQueryBuilder('page')
      .select('MAX(page.order)', 'maxOrder')
      .where('page.workspaceId = :workspaceId', { workspaceId })
      .andWhere(dto.parentId ? 'page.parentId = :parentId' : 'page.parentId IS NULL', {
        parentId: dto.parentId,
      })
      .andWhere('page.isDeleted = false')
      .getRawOne();

    const newOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const page = this.pageRepository.create({
      title: dto.title || 'Untitled',
      icon: dto.icon,
      workspaceId,
      parentId: dto.parentId,
      order: newOrder,
      createdById: userId,
      updatedById: userId,
    });

    await this.pageRepository.save(page);

    return this.mapToDto(page);
  }

  async findById(pageId: string, userId: string): Promise<PageResponseDto> {
    this.logger.debug(`Finding page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    return this.mapToDto(page);
  }

  async getPageWithBlocks(
    pageId: string,
    userId: string,
  ): Promise<{ page: PageResponseDto; blocks: Block[] }> {
    this.logger.debug(`Getting page with blocks: ${pageId}`);

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

    return {
      page: this.mapToDto(page),
      blocks,
    };
  }

  async update(
    pageId: string,
    dto: UpdatePageDto,
    userId: string,
  ): Promise<PageResponseDto> {
    this.logger.debug(`Updating page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    if (dto.title !== undefined) {
      page.title = dto.title;
    }

    if (dto.icon !== undefined) {
      page.icon = dto.icon;
    }

    if (dto.coverImage !== undefined) {
      page.coverImage = dto.coverImage;
    }

    page.updatedById = userId;

    await this.pageRepository.save(page);

    return this.mapToDto(page);
  }

  async delete(pageId: string, userId: string): Promise<void> {
    this.logger.debug(`Soft deleting page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    // Soft delete the page and all children
    await this.softDeleteRecursive(pageId, userId);
  }

  async restore(pageId: string, userId: string): Promise<PageResponseDto> {
    this.logger.debug(`Restoring page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: true },
    });

    if (!page) {
      throw new NotFoundException('Page not found in trash');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    // If parent is deleted, move to root
    if (page.parentId) {
      const parent = await this.pageRepository.findOne({
        where: { id: page.parentId },
      });

      if (parent?.isDeleted) {
        page.parentId = null;
      }
    }

    page.isDeleted = false;
    page.deletedAt = null;
    page.updatedById = userId;

    await this.pageRepository.save(page);

    return this.mapToDto(page);
  }

  async getTrash(workspaceId: string, userId: string): Promise<TrashPageDto[]> {
    this.logger.debug(`Getting trash for workspace: ${workspaceId}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const deletedPages = await this.pageRepository.find({
      where: {
        workspaceId,
        isDeleted: true,
      },
      order: { deletedAt: 'DESC' },
    });

    return deletedPages.map((page) => this.mapToTrashDto(page));
  }

  async duplicate(pageId: string, userId: string): Promise<PageResponseDto> {
    this.logger.debug(`Duplicating page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    // Deep clone the page and all its blocks
    return this.deepClonePage(page, page.parentId, userId);
  }

  async move(
    pageId: string,
    dto: MovePageDto,
    userId: string,
  ): Promise<PageResponseDto> {
    this.logger.debug(`Moving page: ${pageId}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify user has access to current workspace
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    // If moving to a different workspace, verify access
    if (dto.workspaceId && dto.workspaceId !== page.workspaceId) {
      await this.workspacesService.getMemberRole(dto.workspaceId, userId);
      page.workspaceId = dto.workspaceId;
    }

    // Prevent circular references
    if (dto.parentId) {
      const isDescendant = await this.isDescendant(dto.parentId, pageId);
      if (isDescendant) {
        throw new ForbiddenException('Cannot move a page into its own descendant');
      }
      page.parentId = dto.parentId;
    } else if (dto.parentId === null) {
      page.parentId = null;
    }

    if (dto.order !== undefined) {
      page.order = dto.order;
    }

    page.updatedById = userId;

    await this.pageRepository.save(page);

    return this.mapToDto(page);
  }

  private async softDeleteRecursive(pageId: string, userId: string): Promise<void> {
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
    });

    if (!page) return;

    page.isDeleted = true;
    page.deletedAt = new Date();
    page.updatedById = userId;

    await this.pageRepository.save(page);

    // Delete all children
    const children = await this.pageRepository.find({
      where: { parentId: pageId, isDeleted: false },
    });

    for (const child of children) {
      await this.softDeleteRecursive(child.id, userId);
    }
  }

  private async deepClonePage(
    page: Page,
    parentId: string | null,
    userId: string,
  ): Promise<PageResponseDto> {
    // Get max order for siblings
    const maxOrderResult = await this.pageRepository
      .createQueryBuilder('page')
      .select('MAX(page.order)', 'maxOrder')
      .where('page.workspaceId = :workspaceId', { workspaceId: page.workspaceId })
      .andWhere(parentId ? 'page.parentId = :parentId' : 'page.parentId IS NULL', {
        parentId,
      })
      .andWhere('page.isDeleted = false')
      .getRawOne();

    const newOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const newPage = this.pageRepository.create({
      title: `${page.title} (Copy)`,
      icon: page.icon,
      coverImage: page.coverImage,
      workspaceId: page.workspaceId,
      parentId,
      isDatabase: page.isDatabase,
      isTemplate: page.isTemplate,
      order: newOrder,
      createdById: userId,
      updatedById: userId,
    });

    await this.pageRepository.save(newPage);

    // Clone all blocks
    const blocks = await this.blockRepository.find({
      where: { pageId: page.id },
      order: { order: 'ASC' },
    });

    for (const block of blocks) {
      const newBlock = this.blockRepository.create({
        type: block.type,
        pageId: newPage.id,
        content: block.content,
        order: block.order,
        createdById: userId,
      });

      await this.blockRepository.save(newBlock);
    }

    // Clone child pages recursively
    const children = await this.pageRepository.find({
      where: { parentId: page.id, isDeleted: false },
    });

    for (const child of children) {
      await this.deepClonePage(child, newPage.id, userId);
    }

    return this.mapToDto(newPage);
  }

  private async isDescendant(potentialParentId: string, pageId: string): Promise<boolean> {
    if (potentialParentId === pageId) {
      return true;
    }

    const potentialParent = await this.pageRepository.findOne({
      where: { id: potentialParentId },
    });

    if (!potentialParent?.parentId) {
      return false;
    }

    return this.isDescendant(potentialParent.parentId, pageId);
  }

  private buildTree(pages: Page[]): PageTreeNodeDto[] {
    const pageMap = new Map<string, PageTreeNodeDto>();
    const rootPages: PageTreeNodeDto[] = [];

    // First pass: create all nodes
    for (const page of pages) {
      pageMap.set(page.id, {
        ...this.mapToDto(page),
        children: [],
      });
    }

    // Second pass: build tree structure
    for (const page of pages) {
      const node = pageMap.get(page.id)!;

      if (page.parentId && pageMap.has(page.parentId)) {
        pageMap.get(page.parentId)!.children.push(node);
      } else {
        rootPages.push(node);
      }
    }

    return rootPages;
  }

  private mapToDto(page: Page): PageResponseDto {
    return {
      id: page.id,
      title: page.title,
      icon: page.icon,
      coverImage: page.coverImage,
      workspaceId: page.workspaceId,
      parentId: page.parentId,
      isDatabase: page.isDatabase,
      isTemplate: page.isTemplate,
      order: page.order,
      createdById: page.createdById,
      updatedById: page.updatedById,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  private mapToTrashDto(page: Page): TrashPageDto {
    return {
      ...this.mapToDto(page),
      deletedAt: page.deletedAt!,
    };
  }
}
