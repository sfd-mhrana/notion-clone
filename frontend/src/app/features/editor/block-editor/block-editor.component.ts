import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  ViewChildren,
  QueryList,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Block, BlockType, BlockContent, SLASH_COMMANDS, SlashCommandItem } from '../editor.models';
import { TextBlockComponent } from '../blocks/text-block/text-block.component';
import { HeadingBlockComponent } from '../blocks/heading-block/heading-block.component';
import { ListBlockComponent } from '../blocks/list-block/list-block.component';
import { TodoBlockComponent } from '../blocks/todo-block/todo-block.component';
import { QuoteBlockComponent } from '../blocks/quote-block/quote-block.component';
import { CalloutBlockComponent } from '../blocks/callout-block/callout-block.component';
import { DividerBlockComponent } from '../blocks/divider-block/divider-block.component';
import { CodeBlockComponent } from '../blocks/code-block/code-block.component';
import { ImageBlockComponent } from '../blocks/image-block/image-block.component';
import { FileBlockComponent } from '../blocks/file-block/file-block.component';
import { SlashCommandComponent } from '../slash-command/slash-command.component';
import { FormattingToolbarComponent } from '../formatting-toolbar/formatting-toolbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-block-editor',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    TextBlockComponent,
    HeadingBlockComponent,
    ListBlockComponent,
    TodoBlockComponent,
    QuoteBlockComponent,
    CalloutBlockComponent,
    DividerBlockComponent,
    CodeBlockComponent,
    ImageBlockComponent,
    FileBlockComponent,
    SlashCommandComponent,
    FormattingToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="block-editor" (click)="onEditorClick($event)">
      <!-- Formatting Toolbar -->
      @if (showFormattingToolbar()) {
        <app-formatting-toolbar
          [position]="toolbarPosition()"
          (formatApply)="applyFormat($event)"
        />
      }

      <!-- Slash Command Menu -->
      @if (showSlashMenu()) {
        <app-slash-command
          [position]="slashMenuPosition()"
          [filter]="slashFilter()"
          (commandSelect)="onSlashCommand($event)"
          (close)="closeSlashMenu()"
        />
      }

      <!-- Blocks -->
      <div
        class="blocks-container"
        cdkDropList
        (cdkDropListDropped)="onBlockDrop($event)"
      >
        @for (block of blocks(); track block.id; let i = $index) {
          <div
            class="block-wrapper"
            cdkDrag
            [cdkDragData]="block"
            [class.focused]="focusedBlockId() === block.id"
            (mouseenter)="hoveredBlockId.set(block.id)"
            (mouseleave)="hoveredBlockId.set(null)"
          >
            <!-- Drag Handle & Block Menu -->
            <div class="block-controls" [class.visible]="hoveredBlockId() === block.id || focusedBlockId() === block.id">
              <button class="control-btn add-btn" (click)="addBlockAfter(i)" title="Add block">
                <mat-icon>add</mat-icon>
              </button>
              <button class="control-btn drag-handle" cdkDragHandle title="Drag to move">
                <mat-icon>drag_indicator</mat-icon>
              </button>
            </div>

            <!-- Block Content -->
            <div class="block-content">
              @switch (block.type) {
                @case (BlockType.PARAGRAPH) {
                  <app-text-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                    (selectionChange)="onSelectionChange($event)"
                  />
                }
                @case (BlockType.HEADING_1) {
                  <app-heading-block
                    [block]="block"
                    [level]="1"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.HEADING_2) {
                  <app-heading-block
                    [block]="block"
                    [level]="2"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.HEADING_3) {
                  <app-heading-block
                    [block]="block"
                    [level]="3"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.BULLETED_LIST) {
                  <app-list-block
                    [block]="block"
                    [listType]="'bullet'"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                    (indent)="onIndent(i)"
                    (outdent)="onOutdent(i)"
                  />
                }
                @case (BlockType.NUMBERED_LIST) {
                  <app-list-block
                    [block]="block"
                    [listType]="'number'"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                    (indent)="onIndent(i)"
                    (outdent)="onOutdent(i)"
                  />
                }
                @case (BlockType.TODO) {
                  <app-todo-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (checkedChange)="onTodoCheckedChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.QUOTE) {
                  <app-quote-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.CALLOUT) {
                  <app-callout-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (iconChange)="onCalloutIconChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
                @case (BlockType.DIVIDER) {
                  <app-divider-block
                    [block]="block"
                    (click)="onBlockFocus(block.id)"
                  />
                }
                @case (BlockType.CODE) {
                  <app-code-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (languageChange)="onCodeLanguageChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                  />
                }
                @case (BlockType.IMAGE) {
                  <app-image-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (uploadRequest)="onUploadRequest($event)"
                  />
                }
                @case (BlockType.FILE) {
                  <app-file-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (focus)="onBlockFocus(block.id)"
                    (uploadRequest)="onUploadRequest($event)"
                  />
                }
                @default {
                  <app-text-block
                    [block]="block"
                    [focused]="focusedBlockId() === block.id"
                    (contentChange)="onBlockContentChange(block.id, $event)"
                    (focus)="onBlockFocus(block.id)"
                    (blur)="onBlockBlur()"
                    (enter)="onEnterKey(i)"
                    (backspace)="onBackspaceKey(i)"
                    (slashCommand)="openSlashMenu($event)"
                  />
                }
              }
            </div>
          </div>
        }
      </div>

      <!-- Empty state / Add first block -->
      @if (blocks().length === 0) {
        <div class="empty-state" (click)="addFirstBlock()">
          <span class="placeholder">Press '/' for commands, or start typing...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .block-editor {
      position: relative;
      min-height: 100%;
      padding: 0 96px;
      max-width: 900px;
      margin: 0 auto;
    }

    .blocks-container {
      display: flex;
      flex-direction: column;
    }

    .block-wrapper {
      display: flex;
      position: relative;
      margin: 1px 0;
      border-radius: 4px;
    }

    .block-wrapper.focused {
      background: rgba(55, 53, 47, 0.03);
    }

    .block-wrapper:hover {
      background: rgba(55, 53, 47, 0.03);
    }

    .block-controls {
      position: absolute;
      left: -52px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .block-controls.visible {
      opacity: 1;
    }

    .control-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(55, 53, 47, 0.5);
    }

    .control-btn:hover {
      background: rgba(55, 53, 47, 0.08);
      color: rgba(55, 53, 47, 0.8);
    }

    .control-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .drag-handle {
      cursor: grab;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .block-content {
      flex: 1;
      min-width: 0;
    }

    .empty-state {
      padding: 12px 0;
      cursor: text;
    }

    .placeholder {
      color: rgba(55, 53, 47, 0.4);
      font-size: 16px;
    }

    /* Drag preview */
    .cdk-drag-preview {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      padding: 4px 8px;
    }

    .cdk-drag-placeholder {
      background: rgba(55, 53, 47, 0.08);
      border-radius: 4px;
      min-height: 36px;
    }

    .cdk-drag-animating {
      transition: transform 200ms ease;
    }
  `],
})
export class BlockEditorComponent {
  @Input() set initialBlocks(value: Block[]) {
    this.blocks.set(value || []);
  }
  @Input() pageId = '';
  @Input() workspaceId = '';

  @Output() blockCreate = new EventEmitter<{ block: Partial<Block>; afterIndex: number }>();
  @Output() blockUpdate = new EventEmitter<{ blockId: string; content: BlockContent }>();
  @Output() blockDelete = new EventEmitter<string>();
  @Output() blockMove = new EventEmitter<{ blockId: string; newOrder: number }>();
  @Output() blockTypeChange = new EventEmitter<{ blockId: string; newType: BlockType }>();
  @Output() uploadRequest = new EventEmitter<{ blockId: string; file: File }>();

  readonly BlockType = BlockType;

  readonly blocks = signal<Block[]>([]);
  readonly focusedBlockId = signal<string | null>(null);
  readonly hoveredBlockId = signal<string | null>(null);

  // Slash command menu state
  readonly showSlashMenu = signal(false);
  readonly slashMenuPosition = signal({ x: 0, y: 0 });
  readonly slashFilter = signal('');

  // Formatting toolbar state
  readonly showFormattingToolbar = signal(false);
  readonly toolbarPosition = signal({ x: 0, y: 0 });
  readonly selectedText = signal('');

  private pendingBlockIndex = -1;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeSlashMenu();
      this.showFormattingToolbar.set(false);
    }
  }

  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('block-editor') || target.classList.contains('blocks-container')) {
      // Clicked on empty area, focus last block or create new one
      const blocks = this.blocks();
      if (blocks.length > 0) {
        this.focusedBlockId.set(blocks[blocks.length - 1].id);
      } else {
        this.addFirstBlock();
      }
    }
  }

  onBlockFocus(blockId: string): void {
    this.focusedBlockId.set(blockId);
    this.closeSlashMenu();
  }

  onBlockBlur(): void {
    // Delay to allow click events to fire
    setTimeout(() => {
      if (!this.showSlashMenu()) {
        this.focusedBlockId.set(null);
      }
    }, 100);
  }

  onBlockContentChange(blockId: string, content: BlockContent): void {
    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      const updatedBlocks = [...blocks];
      updatedBlocks[index] = { ...updatedBlocks[index], content };
      this.blocks.set(updatedBlocks);
      this.blockUpdate.emit({ blockId, content });
    }
  }

  onEnterKey(index: number): void {
    this.addBlockAfter(index);
  }

  onBackspaceKey(index: number): void {
    const blocks = this.blocks();
    const block = blocks[index];

    // Check if block is empty
    const text = this.getBlockText(block);
    if (text === '' && blocks.length > 1) {
      this.deleteBlock(index);
      // Focus previous block
      if (index > 0) {
        this.focusedBlockId.set(blocks[index - 1].id);
      }
    }
  }

  onIndent(index: number): void {
    // TODO: Implement block nesting
    console.log('Indent block at index:', index);
  }

  onOutdent(index: number): void {
    // TODO: Implement block un-nesting
    console.log('Outdent block at index:', index);
  }

  onTodoCheckedChange(blockId: string, checked: boolean): void {
    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      const block = blocks[index];
      const newContent = { ...block.content, checked };
      this.onBlockContentChange(blockId, newContent);
    }
  }

  onCalloutIconChange(blockId: string, icon: string): void {
    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      const block = blocks[index];
      const newContent = { ...block.content, icon };
      this.onBlockContentChange(blockId, newContent);
    }
  }

  onCodeLanguageChange(blockId: string, language: string): void {
    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      const block = blocks[index];
      const newContent = { ...block.content, language };
      this.onBlockContentChange(blockId, newContent);
    }
  }

  openSlashMenu(event: { position: { x: number; y: number }; filter: string }): void {
    this.slashMenuPosition.set(event.position);
    this.slashFilter.set(event.filter);
    this.showSlashMenu.set(true);
  }

  closeSlashMenu(): void {
    this.showSlashMenu.set(false);
    this.slashFilter.set('');
  }

  onSlashCommand(command: SlashCommandItem): void {
    this.closeSlashMenu();

    const focusedId = this.focusedBlockId();
    if (!focusedId) return;

    const blocks = this.blocks();
    const index = blocks.findIndex(b => b.id === focusedId);
    if (index === -1) return;

    // Change block type
    const updatedBlocks = [...blocks];
    updatedBlocks[index] = {
      ...updatedBlocks[index],
      type: command.blockType,
      content: this.getDefaultContentForType(command.blockType),
    };
    this.blocks.set(updatedBlocks);
    this.blockTypeChange.emit({ blockId: focusedId, newType: command.blockType });
  }

  onSelectionChange(selection: { text: string; rect: DOMRect } | null): void {
    if (selection && selection.text.length > 0) {
      this.selectedText.set(selection.text);
      this.toolbarPosition.set({
        x: selection.rect.left + selection.rect.width / 2,
        y: selection.rect.top - 10,
      });
      this.showFormattingToolbar.set(true);
    } else {
      this.showFormattingToolbar.set(false);
    }
  }

  applyFormat(format: string): void {
    // TODO: Apply formatting to selected text
    console.log('Apply format:', format);
    this.showFormattingToolbar.set(false);
  }

  addFirstBlock(): void {
    const newBlock = this.createNewBlock(BlockType.PARAGRAPH, 0);
    this.blocks.set([newBlock]);
    this.blockCreate.emit({ block: newBlock, afterIndex: -1 });
    setTimeout(() => this.focusedBlockId.set(newBlock.id), 0);
  }

  addBlockAfter(index: number): void {
    const blocks = this.blocks();
    const newOrder = index + 1 < blocks.length ? blocks[index + 1].order : (blocks[index]?.order || 0) + 1;
    const newBlock = this.createNewBlock(BlockType.PARAGRAPH, newOrder);

    const updatedBlocks = [...blocks];
    updatedBlocks.splice(index + 1, 0, newBlock);
    this.blocks.set(updatedBlocks);

    this.blockCreate.emit({ block: newBlock, afterIndex: index });
    setTimeout(() => this.focusedBlockId.set(newBlock.id), 0);
  }

  deleteBlock(index: number): void {
    const blocks = this.blocks();
    const blockId = blocks[index].id;
    const updatedBlocks = blocks.filter((_, i) => i !== index);
    this.blocks.set(updatedBlocks);
    this.blockDelete.emit(blockId);
  }

  onBlockDrop(event: CdkDragDrop<Block[]>): void {
    const blocks = this.blocks();
    const updatedBlocks = [...blocks];
    moveItemInArray(updatedBlocks, event.previousIndex, event.currentIndex);

    // Update order values
    updatedBlocks.forEach((block, i) => {
      block.order = i;
    });

    this.blocks.set(updatedBlocks);

    const movedBlock = updatedBlocks[event.currentIndex];
    this.blockMove.emit({ blockId: movedBlock.id, newOrder: event.currentIndex });
  }

  onUploadRequest(event: { blockId: string; file: File }): void {
    this.uploadRequest.emit(event);
  }

  private createNewBlock(type: BlockType, order: number): Block {
    return {
      id: this.generateTempId(),
      type,
      pageId: this.pageId,
      parentBlockId: null,
      content: this.getDefaultContentForType(type),
      order,
      createdById: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getDefaultContentForType(type: BlockType): BlockContent {
    switch (type) {
      case BlockType.TODO:
        return { rich_text: [], checked: false };
      case BlockType.CODE:
        return { rich_text: [], language: 'javascript' };
      case BlockType.CALLOUT:
        return { rich_text: [], icon: '💡' };
      default:
        return { rich_text: [] };
    }
  }

  private getBlockText(block: Block): string {
    if (!block.content.rich_text) return '';
    return block.content.rich_text.map(rt => rt.plain_text).join('');
  }

  private generateTempId(): string {
    return 'temp-' + Math.random().toString(36).substr(2, 9);
  }
}
