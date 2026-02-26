import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { Block } from '../../database/entities/block.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';

export type ExportFormat = 'markdown' | 'html' | 'json';

interface ExportOptions {
  format: ExportFormat;
  includeSubpages?: boolean;
  includeMetadata?: boolean;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async exportPage(
    pageId: string,
    userId: string,
    options: ExportOptions,
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    this.logger.debug(`Exporting page ${pageId} as ${options.format}`);

    const page = await this.pageRepository.findOne({
      where: { id: pageId, isDeleted: false },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Verify access
    await this.workspacesService.getMemberRole(page.workspaceId, userId);

    const blocks = await this.blockRepository.find({
      where: { pageId },
      order: { order: 'ASC' },
    });

    let content: string;
    let mimeType: string;
    let extension: string;

    switch (options.format) {
      case 'markdown':
        content = this.toMarkdown(page, blocks);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      case 'html':
        content = this.toHtml(page, blocks);
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'json':
        content = this.toJson(page, blocks, options.includeMetadata);
        mimeType = 'application/json';
        extension = 'json';
        break;
    }

    const filename = `${this.sanitizeFilename(page.title || 'Untitled')}.${extension}`;

    return { content, filename, mimeType };
  }

  async exportWorkspace(
    workspaceId: string,
    userId: string,
    _options: ExportOptions,
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    this.logger.debug(`Exporting workspace ${workspaceId}`);

    // Verify access
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const pages = await this.pageRepository.find({
      where: { workspaceId, isDeleted: false },
    });

    const exportData: unknown[] = [];

    for (const page of pages) {
      const blocks = await this.blockRepository.find({
        where: { pageId: page.id },
        order: { order: 'ASC' },
      });
      exportData.push({ page, blocks });
    }

    const content = JSON.stringify(exportData, null, 2);
    const filename = `workspace-export-${new Date().toISOString().split('T')[0]}.json`;

    return { content, filename, mimeType: 'application/json' };
  }

  private toMarkdown(page: Page, blocks: Block[]): string {
    let md = `# ${page.title || 'Untitled'}\n\n`;

    for (const block of blocks) {
      md += this.blockToMarkdown(block) + '\n';
    }

    return md;
  }

  private blockToMarkdown(block: Block): string {
    const content = block.content as Record<string, unknown>;
    const text = this.extractText(content);

    switch (block.type) {
      case 'paragraph':
        return text + '\n';
      case 'heading_1':
        return `# ${text}\n`;
      case 'heading_2':
        return `## ${text}\n`;
      case 'heading_3':
        return `### ${text}\n`;
      case 'bulleted_list_item':
        return `- ${text}`;
      case 'numbered_list_item':
        return `1. ${text}`;
      case 'to_do':
        const checked = content.checked ? 'x' : ' ';
        return `- [${checked}] ${text}`;
      case 'quote':
        return `> ${text}\n`;
      case 'code':
        const lang = (content.language as string) || '';
        return `\`\`\`${lang}\n${text}\n\`\`\`\n`;
      case 'divider':
        return '---\n';
      case 'callout':
        const icon = (content.icon as string) || '💡';
        return `> ${icon} ${text}\n`;
      case 'image':
        const url = (content.url as string) || '';
        return `![Image](${url})\n`;
      default:
        return text + '\n';
    }
  }

  private toHtml(page: Page, blocks: Block[]): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(page.title || 'Untitled')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 16px; }
    .callout { background: #f7f6f3; padding: 16px; border-radius: 4px; }
    .todo { display: flex; align-items: center; gap: 8px; }
    hr { border: none; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <h1>${this.escapeHtml(page.title || 'Untitled')}</h1>
`;

    for (const block of blocks) {
      html += this.blockToHtml(block);
    }

    html += '</body>\n</html>';
    return html;
  }

  private blockToHtml(block: Block): string {
    const content = block.content as Record<string, unknown>;
    const text = this.escapeHtml(this.extractText(content));

    switch (block.type) {
      case 'paragraph':
        return `  <p>${text}</p>\n`;
      case 'heading_1':
        return `  <h1>${text}</h1>\n`;
      case 'heading_2':
        return `  <h2>${text}</h2>\n`;
      case 'heading_3':
        return `  <h3>${text}</h3>\n`;
      case 'bulleted_list_item':
        return `  <ul><li>${text}</li></ul>\n`;
      case 'numbered_list_item':
        return `  <ol><li>${text}</li></ol>\n`;
      case 'to_do':
        const checked = content.checked ? 'checked' : '';
        return `  <div class="todo"><input type="checkbox" ${checked} disabled /><span>${text}</span></div>\n`;
      case 'quote':
        return `  <blockquote>${text}</blockquote>\n`;
      case 'code':
        const lang = (content.language as string) || '';
        return `  <pre><code class="language-${lang}">${text}</code></pre>\n`;
      case 'divider':
        return '  <hr />\n';
      case 'callout':
        const icon = (content.icon as string) || '💡';
        return `  <div class="callout">${icon} ${text}</div>\n`;
      case 'image':
        const url = (content.url as string) || '';
        return `  <img src="${url}" alt="Image" />\n`;
      default:
        return `  <p>${text}</p>\n`;
    }
  }

  private toJson(page: Page, blocks: Block[], includeMetadata = true): string {
    const data = {
      page: includeMetadata ? page : { id: page.id, title: page.title },
      blocks: blocks.map(b => ({
        id: b.id,
        type: b.type,
        content: b.content,
        order: b.order,
        ...(includeMetadata ? { createdAt: b.createdAt, updatedAt: b.updatedAt } : {}),
      })),
    };
    return JSON.stringify(data, null, 2);
  }

  private extractText(content: Record<string, unknown>): string {
    const richText = content.rich_text as Array<{ plain_text?: string }> | undefined;
    if (!richText) return '';
    return richText.map(rt => rt.plain_text || '').join('');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  }
}
