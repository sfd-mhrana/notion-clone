import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from '../../database/entities/page.entity.js';
import { Block, BlockType } from '../../database/entities/block.entity.js';
import { WorkspacesService } from '../workspaces/workspaces.service.js';
import {
  ExportFormat,
  ExportPageDto,
  ExportResponseDto,
  ImportFormat,
  ImportPageDto,
  ImportResponseDto,
} from './dto/index.js';

interface RichTextItem {
  text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    code?: boolean;
  };
  href?: string;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async exportPage(
    pageId: string,
    dto: ExportPageDto,
    userId: string,
  ): Promise<ExportResponseDto> {
    this.logger.debug(`Exporting page ${pageId} as ${dto.format}`);

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

    let childPages: Page[] = [];
    if (dto.includeChildren) {
      childPages = await this.getChildPagesRecursive(pageId);
    }

    switch (dto.format) {
      case ExportFormat.MARKDOWN:
        return this.exportToMarkdown(page, blocks, childPages);
      case ExportFormat.HTML:
        return this.exportToHtml(page, blocks, childPages);
      case ExportFormat.PDF:
        return this.exportToPdf(page, blocks, childPages);
      default:
        throw new BadRequestException('Unsupported export format');
    }
  }

  async exportWorkspace(
    workspaceId: string,
    format: ExportFormat,
    userId: string,
  ): Promise<ExportResponseDto> {
    this.logger.debug(`Exporting workspace ${workspaceId} as ${format}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    const pages = await this.pageRepository.find({
      where: { workspaceId, isDeleted: false },
      order: { order: 'ASC' },
    });

    const allBlocks = await this.blockRepository
      .createQueryBuilder('block')
      .innerJoin('block.page', 'page')
      .where('page.workspaceId = :workspaceId', { workspaceId })
      .andWhere('page.isDeleted = false')
      .orderBy('block.order', 'ASC')
      .getMany();

    const blocksByPageId = new Map<string, Block[]>();
    for (const block of allBlocks) {
      const pageBlocks = blocksByPageId.get(block.pageId) || [];
      pageBlocks.push(block);
      blocksByPageId.set(block.pageId, pageBlocks);
    }

    let content = '';
    const contentType = format === ExportFormat.PDF ? 'application/pdf' : 'text/plain';

    for (const page of pages) {
      const pageBlocks = blocksByPageId.get(page.id) || [];

      if (format === ExportFormat.MARKDOWN) {
        content += this.pageToMarkdown(page, pageBlocks);
        content += '\n\n---\n\n';
      } else if (format === ExportFormat.HTML) {
        content += this.pageToHtml(page, pageBlocks);
        content += '\n<hr />\n';
      }
    }

    return {
      filename: `workspace-export.${this.getFileExtension(format)}`,
      contentType,
      content,
    };
  }

  async importPage(
    workspaceId: string,
    dto: ImportPageDto,
    userId: string,
  ): Promise<ImportResponseDto> {
    this.logger.debug(`Importing page to workspace ${workspaceId}`);

    // Verify user has access to workspace
    await this.workspacesService.getMemberRole(workspaceId, userId);

    switch (dto.format) {
      case ImportFormat.MARKDOWN:
        return this.importFromMarkdown(workspaceId, dto, userId);
      case ImportFormat.HTML:
        return this.importFromHtml(workspaceId, dto, userId);
      default:
        throw new BadRequestException('Unsupported import format');
    }
  }

  private async getChildPagesRecursive(pageId: string): Promise<Page[]> {
    const children = await this.pageRepository.find({
      where: { parentId: pageId, isDeleted: false },
    });

    const allChildren: Page[] = [...children];

    for (const child of children) {
      const grandchildren = await this.getChildPagesRecursive(child.id);
      allChildren.push(...grandchildren);
    }

    return allChildren;
  }

  private exportToMarkdown(
    page: Page,
    blocks: Block[],
    childPages: Page[],
  ): ExportResponseDto {
    let content = this.pageToMarkdown(page, blocks);

    if (childPages.length > 0) {
      content += '\n\n## Child Pages\n\n';
      for (const childPage of childPages) {
        content += `- ${childPage.title}\n`;
      }
    }

    return {
      filename: `${this.sanitizeFilename(page.title)}.md`,
      contentType: 'text/markdown',
      content,
    };
  }

  private exportToHtml(
    page: Page,
    blocks: Block[],
    childPages: Page[],
  ): ExportResponseDto {
    let content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(page.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    h2 { font-size: 1.75em; margin-top: 1.5em; }
    h3 { font-size: 1.25em; margin-top: 1.25em; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'Fira Code', monospace; }
    blockquote { border-left: 3px solid #333; margin: 0; padding-left: 16px; color: #666; }
    .callout { background: #f7f6f3; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .todo { display: flex; align-items: center; gap: 8px; }
    .todo input { margin: 0; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
  </style>
</head>
<body>
`;

    content += this.pageToHtml(page, blocks);

    if (childPages.length > 0) {
      content += '<h2>Child Pages</h2>\n<ul>\n';
      for (const childPage of childPages) {
        content += `  <li>${this.escapeHtml(childPage.title)}</li>\n`;
      }
      content += '</ul>\n';
    }

    content += '</body>\n</html>';

    return {
      filename: `${this.sanitizeFilename(page.title)}.html`,
      contentType: 'text/html',
      content,
    };
  }

  private exportToPdf(
    page: Page,
    blocks: Block[],
    childPages: Page[],
  ): ExportResponseDto {
    // Generate HTML first, then convert to PDF
    const htmlExport = this.exportToHtml(page, blocks, childPages);

    // For PDF, we return the HTML content with PDF content type
    // In production, this would use puppeteer or a PDF generation library
    // For now, we return HTML that can be converted client-side or via a separate service
    return {
      filename: `${this.sanitizeFilename(page.title)}.pdf`,
      contentType: 'application/pdf',
      content: htmlExport.content as string,
    };
  }

  private pageToMarkdown(page: Page, blocks: Block[]): string {
    let md = `# ${page.title}\n\n`;

    for (const block of blocks) {
      md += this.blockToMarkdown(block);
    }

    return md;
  }

  private blockToMarkdown(block: Block): string {
    const content = block.content as Record<string, unknown>;
    const richText = (content.richText as RichTextItem[]) || [];
    const text = this.richTextToMarkdown(richText);

    switch (block.type) {
      case BlockType.PARAGRAPH:
        return text ? `${text}\n\n` : '\n';

      case BlockType.HEADING_1:
        return `# ${text}\n\n`;

      case BlockType.HEADING_2:
        return `## ${text}\n\n`;

      case BlockType.HEADING_3:
        return `### ${text}\n\n`;

      case BlockType.BULLETED_LIST_ITEM:
        return `- ${text}\n`;

      case BlockType.NUMBERED_LIST_ITEM:
        return `1. ${text}\n`;

      case BlockType.TO_DO:
        const checked = content.checked ? 'x' : ' ';
        return `- [${checked}] ${text}\n`;

      case BlockType.TOGGLE:
        return `<details>\n<summary>${text}</summary>\n</details>\n\n`;

      case BlockType.CODE:
        const language = (content.language as string) || '';
        return `\`\`\`${language}\n${text}\n\`\`\`\n\n`;

      case BlockType.QUOTE:
        return `> ${text}\n\n`;

      case BlockType.CALLOUT:
        const icon = (content.icon as string) || '💡';
        return `> ${icon} ${text}\n\n`;

      case BlockType.DIVIDER:
        return `---\n\n`;

      case BlockType.IMAGE:
        const url = (content.url as string) || '';
        const caption = (content.caption as string) || '';
        return `![${caption}](${url})\n\n`;

      default:
        return text ? `${text}\n\n` : '';
    }
  }

  private richTextToMarkdown(richText: RichTextItem[]): string {
    return richText
      .map((item) => {
        let text = item.text;

        if (item.annotations?.code) {
          text = `\`${text}\``;
        }
        if (item.annotations?.bold) {
          text = `**${text}**`;
        }
        if (item.annotations?.italic) {
          text = `*${text}*`;
        }
        if (item.annotations?.strikethrough) {
          text = `~~${text}~~`;
        }
        if (item.href) {
          text = `[${text}](${item.href})`;
        }

        return text;
      })
      .join('');
  }

  private pageToHtml(page: Page, blocks: Block[]): string {
    let html = `<h1>${this.escapeHtml(page.title)}</h1>\n`;

    for (const block of blocks) {
      html += this.blockToHtml(block);
    }

    return html;
  }

  private blockToHtml(block: Block): string {
    const content = block.content as Record<string, unknown>;
    const richText = (content.richText as RichTextItem[]) || [];
    const text = this.richTextToHtml(richText);

    switch (block.type) {
      case BlockType.PARAGRAPH:
        return `<p>${text}</p>\n`;

      case BlockType.HEADING_1:
        return `<h1>${text}</h1>\n`;

      case BlockType.HEADING_2:
        return `<h2>${text}</h2>\n`;

      case BlockType.HEADING_3:
        return `<h3>${text}</h3>\n`;

      case BlockType.BULLETED_LIST_ITEM:
        return `<ul><li>${text}</li></ul>\n`;

      case BlockType.NUMBERED_LIST_ITEM:
        return `<ol><li>${text}</li></ol>\n`;

      case BlockType.TO_DO:
        const checked = content.checked ? 'checked' : '';
        return `<div class="todo"><input type="checkbox" ${checked} disabled /><span>${text}</span></div>\n`;

      case BlockType.TOGGLE:
        return `<details><summary>${text}</summary></details>\n`;

      case BlockType.CODE:
        const language = (content.language as string) || '';
        return `<pre><code class="language-${language}">${this.escapeHtml(this.plainTextFromRichText(richText))}</code></pre>\n`;

      case BlockType.QUOTE:
        return `<blockquote>${text}</blockquote>\n`;

      case BlockType.CALLOUT:
        const icon = (content.icon as string) || '💡';
        return `<div class="callout"><span>${icon}</span> ${text}</div>\n`;

      case BlockType.DIVIDER:
        return `<hr />\n`;

      case BlockType.IMAGE:
        const url = (content.url as string) || '';
        const caption = (content.caption as string) || '';
        return `<figure><img src="${this.escapeHtml(url)}" alt="${this.escapeHtml(caption)}" /><figcaption>${this.escapeHtml(caption)}</figcaption></figure>\n`;

      default:
        return `<p>${text}</p>\n`;
    }
  }

  private richTextToHtml(richText: RichTextItem[]): string {
    return richText
      .map((item) => {
        let text = this.escapeHtml(item.text);

        if (item.annotations?.code) {
          text = `<code>${text}</code>`;
        }
        if (item.annotations?.bold) {
          text = `<strong>${text}</strong>`;
        }
        if (item.annotations?.italic) {
          text = `<em>${text}</em>`;
        }
        if (item.annotations?.strikethrough) {
          text = `<del>${text}</del>`;
        }
        if (item.href) {
          text = `<a href="${this.escapeHtml(item.href)}">${text}</a>`;
        }

        return text;
      })
      .join('');
  }

  private plainTextFromRichText(richText: RichTextItem[]): string {
    return richText.map((item) => item.text).join('');
  }

  private async importFromMarkdown(
    workspaceId: string,
    dto: ImportPageDto,
    userId: string,
  ): Promise<ImportResponseDto> {
    const lines = dto.content.split('\n');
    let title = dto.title || 'Imported Page';
    const blocks: Partial<Block>[] = [];
    let order = 0;

    // Extract title from first heading if not provided
    for (const line of lines) {
      if (line.startsWith('# ') && !dto.title) {
        title = line.slice(2).trim();
        break;
      }
    }

    // Parse markdown lines into blocks
    let inCodeBlock = false;
    let codeContent = '';
    let codeLanguage = '';

    for (const line of lines) {
      // Skip title line
      if (line.startsWith('# ') && line.slice(2).trim() === title) {
        continue;
      }

      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
          codeContent = '';
        } else {
          blocks.push({
            type: BlockType.CODE,
            content: {
              richText: [{ text: codeContent.trim(), annotations: {} }],
              language: codeLanguage,
            },
            order: order++,
            createdById: userId,
          });
          inCodeBlock = false;
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent += line + '\n';
        continue;
      }

      // Skip empty lines (but could add as empty paragraph)
      if (!line.trim()) {
        continue;
      }

      const block = this.parseMarkdownLine(line, order++, userId);
      if (block) {
        blocks.push(block);
      }
    }

    // Create page
    const maxOrderResult = await this.pageRepository
      .createQueryBuilder('page')
      .select('MAX(page.order)', 'maxOrder')
      .where('page.workspaceId = :workspaceId', { workspaceId })
      .andWhere(dto.parentId ? 'page.parentId = :parentId' : 'page.parentId IS NULL', {
        parentId: dto.parentId,
      })
      .andWhere('page.isDeleted = false')
      .getRawOne();

    const pageOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const page = this.pageRepository.create({
      title,
      workspaceId,
      parentId: dto.parentId || null,
      order: pageOrder,
      createdById: userId,
      updatedById: userId,
    });

    await this.pageRepository.save(page);

    // Create blocks
    for (const blockData of blocks) {
      const block = this.blockRepository.create({
        ...blockData,
        pageId: page.id,
      });
      await this.blockRepository.save(block);
    }

    return {
      pageId: page.id,
      title: page.title,
      blocksCreated: blocks.length,
    };
  }

  private parseMarkdownLine(
    line: string,
    order: number,
    userId: string,
  ): Partial<Block> | null {
    // Headings
    if (line.startsWith('### ')) {
      return {
        type: BlockType.HEADING_3,
        content: { richText: this.parseInlineMarkdown(line.slice(4)) },
        order,
        createdById: userId,
      };
    }
    if (line.startsWith('## ')) {
      return {
        type: BlockType.HEADING_2,
        content: { richText: this.parseInlineMarkdown(line.slice(3)) },
        order,
        createdById: userId,
      };
    }
    if (line.startsWith('# ')) {
      return {
        type: BlockType.HEADING_1,
        content: { richText: this.parseInlineMarkdown(line.slice(2)) },
        order,
        createdById: userId,
      };
    }

    // Divider
    if (line === '---' || line === '***' || line === '___') {
      return {
        type: BlockType.DIVIDER,
        content: {},
        order,
        createdById: userId,
      };
    }

    // Quote
    if (line.startsWith('> ')) {
      return {
        type: BlockType.QUOTE,
        content: { richText: this.parseInlineMarkdown(line.slice(2)) },
        order,
        createdById: userId,
      };
    }

    // Todo items
    const todoMatch = line.match(/^- \[([ x])\] (.+)$/);
    if (todoMatch) {
      return {
        type: BlockType.TO_DO,
        content: {
          richText: this.parseInlineMarkdown(todoMatch[2]),
          checked: todoMatch[1] === 'x',
        },
        order,
        createdById: userId,
      };
    }

    // Bulleted list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return {
        type: BlockType.BULLETED_LIST_ITEM,
        content: { richText: this.parseInlineMarkdown(line.slice(2)) },
        order,
        createdById: userId,
      };
    }

    // Numbered list
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      return {
        type: BlockType.NUMBERED_LIST_ITEM,
        content: { richText: this.parseInlineMarkdown(numberedMatch[1]) },
        order,
        createdById: userId,
      };
    }

    // Image
    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      return {
        type: BlockType.IMAGE,
        content: { caption: imageMatch[1], url: imageMatch[2] },
        order,
        createdById: userId,
      };
    }

    // Default to paragraph
    return {
      type: BlockType.PARAGRAPH,
      content: { richText: this.parseInlineMarkdown(line) },
      order,
      createdById: userId,
    };
  }

  private parseInlineMarkdown(text: string): RichTextItem[] {
    // Simplified inline markdown parsing
    // In a full implementation, this would handle nested formatting
    const items: RichTextItem[] = [];
    let remaining = text;

    // Simple implementation: just create a single text item
    // A full implementation would parse bold, italic, links, etc.
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    const codeMatch = remaining.match(/`(.+?)`/);
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

    if (!boldMatch && !italicMatch && !codeMatch && !linkMatch) {
      items.push({ text: remaining, annotations: {} });
      return items;
    }

    // For simplicity, just strip formatting and return plain text
    // A proper implementation would maintain formatting
    let plainText = remaining
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    items.push({ text: plainText, annotations: {} });
    return items;
  }

  private async importFromHtml(
    workspaceId: string,
    dto: ImportPageDto,
    userId: string,
  ): Promise<ImportResponseDto> {
    // Simple HTML import - strip tags and import as markdown
    const plainText = dto.content
      .replace(/<h1[^>]*>([^<]+)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>([^<]+)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>([^<]+)<\/h3>/gi, '### $1\n')
      .replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n')
      .replace(/<li[^>]*>([^<]+)<\/li>/gi, '- $1\n')
      .replace(/<br[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '');

    return this.importFromMarkdown(
      workspaceId,
      { ...dto, content: plainText, format: ImportFormat.MARKDOWN },
      userId,
    );
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
    return name
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 100) || 'untitled';
  }

  private getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.MARKDOWN:
        return 'md';
      case ExportFormat.HTML:
        return 'html';
      case ExportFormat.PDF:
        return 'pdf';
      default:
        return 'txt';
    }
  }
}
