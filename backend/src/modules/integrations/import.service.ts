import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { Block, BlockType } from '../../database/entities/block.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import { v4 as uuidv4 } from 'uuid';

export type ImportFormat = 'markdown' | 'notion' | 'json';

interface ImportOptions {
  format: ImportFormat;
  workspaceId: string;
  parentPageId?: string;
}

interface ImportResult {
  pagesCreated: number;
  blocksCreated: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async importContent(
    content: string,
    userId: string,
    options: ImportOptions,
  ): Promise<ImportResult> {
    this.logger.debug(`Importing content as ${options.format}`);

    // Verify access
    await this.workspacesService.getMemberRole(options.workspaceId, userId);

    switch (options.format) {
      case 'markdown':
        return this.importMarkdown(content, userId, options);
      case 'json':
        return this.importJson(content, userId, options);
      case 'notion':
        return this.importNotion(content, userId, options);
      default:
        throw new BadRequestException('Unsupported import format');
    }
  }

  private async importMarkdown(
    content: string,
    userId: string,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = { pagesCreated: 0, blocksCreated: 0, errors: [] };

    try {
      // Parse title from first heading or use default
      const lines = content.split('\n');
      let title = 'Imported Page';
      let startIndex = 0;

      if (lines[0]?.startsWith('# ')) {
        title = lines[0].substring(2).trim();
        startIndex = 1;
      }

      // Create page
      const page = this.pageRepository.create({
        title,
        workspaceId: options.workspaceId,
        parentId: options.parentPageId,
        createdById: userId,
        updatedById: userId,
      });
      await this.pageRepository.save(page);
      result.pagesCreated++;

      // Parse blocks
      let order = 0;
      const blocks: Block[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const block = this.parseMarkdownLine(line, page.id, userId, order);
        if (block) {
          blocks.push(block);
          order++;
        }
      }

      if (blocks.length > 0) {
        await this.blockRepository.save(blocks);
        result.blocksCreated = blocks.length;
      }
    } catch (error) {
      this.logger.error('Markdown import error:', error);
      result.errors.push(`Import failed: ${(error as Error).message}`);
    }

    return result;
  }

  private parseMarkdownLine(
    line: string,
    pageId: string,
    userId: string,
    order: number,
  ): Block | null {
    if (!line.trim()) return null;

    let type: BlockType = BlockType.PARAGRAPH;
    let text = line;
    const content: Record<string, unknown> = {};

    // Headings
    if (line.startsWith('### ')) {
      type = BlockType.HEADING_3;
      text = line.substring(4);
    } else if (line.startsWith('## ')) {
      type = BlockType.HEADING_2;
      text = line.substring(3);
    } else if (line.startsWith('# ')) {
      type = BlockType.HEADING_1;
      text = line.substring(2);
    }
    // Lists
    else if (line.match(/^[-*] \[[ x]\] /)) {
      type = BlockType.TO_DO;
      content.checked = line.includes('[x]');
      text = line.replace(/^[-*] \[[ x]\] /, '');
    } else if (line.match(/^[-*] /)) {
      type = BlockType.BULLETED_LIST_ITEM;
      text = line.replace(/^[-*] /, '');
    } else if (line.match(/^\d+\. /)) {
      type = BlockType.NUMBERED_LIST_ITEM;
      text = line.replace(/^\d+\. /, '');
    }
    // Quote
    else if (line.startsWith('> ')) {
      type = BlockType.QUOTE;
      text = line.substring(2);
    }
    // Divider
    else if (line.match(/^[-*_]{3,}$/)) {
      type = BlockType.DIVIDER;
      text = '';
    }

    content.rich_text = text
      ? [{ type: 'text', text: { text }, annotations: {}, plain_text: text }]
      : [];

    const block = this.blockRepository.create({
      id: uuidv4(),
      type,
      pageId,
      content,
      order,
      createdById: userId,
    });

    return block;
  }

  private async importJson(
    content: string,
    userId: string,
    options: ImportOptions,
  ): Promise<ImportResult> {
    const result: ImportResult = { pagesCreated: 0, blocksCreated: 0, errors: [] };

    try {
      const data = JSON.parse(content);

      // Handle single page or array
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const pageData = item.page || item;
        const blocksData = item.blocks || [];

        // Create page
        const page = this.pageRepository.create({
          title: pageData.title || 'Imported Page',
          icon: pageData.icon,
          coverImage: pageData.coverImage,
          workspaceId: options.workspaceId,
          parentId: options.parentPageId,
          createdById: userId,
          updatedById: userId,
        });
        await this.pageRepository.save(page);
        result.pagesCreated++;

        // Create blocks
        for (let i = 0; i < blocksData.length; i++) {
          const blockData = blocksData[i];
          const block = this.blockRepository.create({
            id: uuidv4(),
            type: blockData.type || BlockType.PARAGRAPH,
            pageId: page.id,
            content: blockData.content || { rich_text: [] },
            order: blockData.order ?? i,
            createdById: userId,
          });
          await this.blockRepository.save(block);
          result.blocksCreated++;
        }
      }
    } catch (error) {
      this.logger.error('JSON import error:', error);
      result.errors.push(`Import failed: ${(error as Error).message}`);
    }

    return result;
  }

  private async importNotion(
    content: string,
    userId: string,
    options: ImportOptions,
  ): Promise<ImportResult> {
    // Notion export format is typically markdown or HTML
    // Try to detect and handle appropriately
    if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
      // HTML export - strip tags and import as markdown-ish
      const strippedContent = content
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      return this.importMarkdown(strippedContent, userId, options);
    }

    // Assume markdown
    return this.importMarkdown(content, userId, options);
  }
}
