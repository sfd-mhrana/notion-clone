import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { Block } from '../../database/entities/block.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { SearchQueryDto, SearchResultDto, SearchResponseDto } from './dto/index.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async search(dto: SearchQueryDto, userId: string): Promise<SearchResponseDto> {
    this.logger.debug(`Searching for "${dto.q}" in workspace ${dto.workspaceId}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(dto.workspaceId, userId);

    const types = dto.types || ['page', 'block'];
    const limit = dto.limit || 20;
    const results: SearchResultDto[] = [];

    if (types.includes('page')) {
      const pageResults = await this.searchPages(dto.q, dto.workspaceId, limit);
      results.push(...pageResults);
    }

    if (types.includes('block')) {
      const blockResults = await this.searchBlocks(dto.q, dto.workspaceId, limit);
      results.push(...blockResults);
    }

    // Sort by relevance (simple approach: exact matches first, then partial)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(dto.q.toLowerCase());
      const bExact = b.title.toLowerCase().includes(dto.q.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return {
      results: results.slice(0, limit),
      total: results.length,
      query: dto.q,
    };
  }

  private async searchPages(
    query: string,
    workspaceId: string,
    limit: number,
  ): Promise<SearchResultDto[]> {
    const pages = await this.pageRepository
      .createQueryBuilder('page')
      .where('page.workspaceId = :workspaceId', { workspaceId })
      .andWhere('page.isDeleted = false')
      .andWhere('LOWER(page.title) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('page.updatedAt', 'DESC')
      .take(limit)
      .getMany();

    return pages.map((page) => ({
      type: 'page' as const,
      id: page.id,
      title: page.title,
      workspaceId: page.workspaceId,
    }));
  }

  private async searchBlocks(
    query: string,
    workspaceId: string,
    limit: number,
  ): Promise<SearchResultDto[]> {
    // Search in block content (jsonb)
    const blocks = await this.blockRepository
      .createQueryBuilder('block')
      .innerJoin('block.page', 'page')
      .where('page.workspaceId = :workspaceId', { workspaceId })
      .andWhere('page.isDeleted = false')
      .andWhere("block.content::text ILIKE :query", { query: `%${query}%` })
      .orderBy('block.updatedAt', 'DESC')
      .take(limit)
      .addSelect(['page.id', 'page.title'])
      .getMany();

    return blocks.map((block) => {
      const contentText = this.extractTextFromContent(block.content);
      const snippet = this.createSnippet(contentText, query);

      return {
        type: 'block' as const,
        id: block.id,
        title: snippet || 'Block',
        snippet,
        pageId: block.pageId,
        pageTitle: block.page?.title,
        workspaceId,
      };
    });
  }

  private extractTextFromContent(content: Record<string, unknown>): string {
    // Handle different content formats
    if ('richText' in content && Array.isArray(content.richText)) {
      return (content.richText as Array<{ text: string }>)
        .map((item) => item.text)
        .join('');
    }

    if ('text' in content && typeof content.text === 'string') {
      return content.text;
    }

    // Fallback: stringify and extract readable text
    return JSON.stringify(content)
      .replace(/[{}\[\]",:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createSnippet(text: string, query: string, maxLength = 100): string {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 50);

    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}
