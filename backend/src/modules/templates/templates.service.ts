import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity.js';
import { CreateTemplateDto, UpdateTemplateDto, TemplateResponseDto } from './dto/index.js';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async findAll(
    userId: string,
    workspaceId?: string,
    category?: string,
  ): Promise<TemplateResponseDto[]> {
    this.logger.debug(`Fetching templates for user: ${userId}`);

    const query = this.templateRepository.createQueryBuilder('template');

    // Get public templates or templates created by user or in user's workspace
    query.where(
      '(template.is_public = :isPublic OR template.created_by_id = :userId' +
      (workspaceId ? ' OR template.workspace_id = :workspaceId' : '') + ')',
      { isPublic: true, userId, workspaceId },
    );

    if (category) {
      query.andWhere('template.category = :category', { category });
    }

    query.orderBy('template.usage_count', 'DESC');

    const templates = await query.getMany();
    return templates.map(t => this.mapToDto(t));
  }

  async findOne(id: string, userId: string): Promise<TemplateResponseDto> {
    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check access
    if (!template.isPublic && template.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this template');
    }

    return this.mapToDto(template);
  }

  async create(dto: CreateTemplateDto, userId: string): Promise<TemplateResponseDto> {
    this.logger.debug(`Creating template: ${dto.name}`);

    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      icon: dto.icon,
      coverImage: dto.coverImage,
      category: dto.category || 'general',
      content: dto.content,
      isPublic: dto.isPublic ?? false,
      workspaceId: dto.workspaceId,
      createdById: userId,
    });

    await this.templateRepository.save(template);
    return this.mapToDto(template);
  }

  async update(
    id: string,
    dto: UpdateTemplateDto,
    userId: string,
  ): Promise<TemplateResponseDto> {
    this.logger.debug(`Updating template: ${id}`);

    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdById !== userId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    Object.assign(template, dto);
    await this.templateRepository.save(template);

    return this.mapToDto(template);
  }

  async delete(id: string, userId: string): Promise<void> {
    this.logger.debug(`Deleting template: ${id}`);

    const template = await this.templateRepository.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.templateRepository.delete(id);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.templateRepository.increment({ id }, 'usageCount', 1);
  }

  async createFromPage(
    _pageId: string,
    _name: string,
    _userId: string,
    _workspaceId?: string,
  ): Promise<TemplateResponseDto> {
    // This would fetch the page and its blocks, then create a template
    // Implementation depends on PagesService and BlocksService
    throw new Error('Not implemented - requires page service integration');
  }

  private mapToDto(template: Template): TemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      coverImage: template.coverImage,
      category: template.category,
      content: template.content,
      isPublic: template.isPublic,
      usageCount: template.usageCount,
      workspaceId: template.workspaceId,
      createdById: template.createdById,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
