import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Page, Block } from '../services/supabase.service';
import { BlockComponent } from './block.component';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, BlockComponent],
  template: `
    <div class="page-editor" *ngIf="currentPage">
      <div class="page-header">
        <input
          type="text"
          class="page-title"
          [(ngModel)]="currentPage.title"
          (blur)="updatePageTitle()"
          placeholder="Untitled"
        />
      </div>

      <div class="blocks-container" #blocksContainer>
        <app-block
          *ngFor="let block of blocks; trackBy: trackByBlockId"
          [block]="block"
          (contentChanged)="onBlockContentChanged($event)"
          (typeChanged)="onBlockTypeChanged($event)"
          (deleted)="onBlockDeleted($event)"
          (enterPressed)="onEnterPressed($event)"
          (dragStarted)="onDragStart($event, block)"
        ></app-block>

        <div class="add-block" (click)="addNewBlock()">
          <span class="plus-icon">+</span>
          <span class="hint">Click to add a block</span>
        </div>
      </div>

      <div
        class="drag-preview"
        *ngIf="draggedBlock"
        [style.top.px]="dragPreviewTop"
        [style.left.px]="dragPreviewLeft"
      >
        {{ draggedBlock.content || 'Empty block' }}
      </div>
    </div>

    <div class="empty-state" *ngIf="!currentPage">
      <p>Select a page from the sidebar or create a new one to get started.</p>
    </div>
  `,
  styles: [`
    .page-editor {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      background: white;
    }

    .page-header {
      padding: 60px 96px 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-title {
      width: 100%;
      font-size: 40px;
      font-weight: 700;
      border: none;
      outline: none;
      padding: 0;
      color: #37352f;
      background: transparent;
    }

    .page-title::placeholder {
      color: #9b9a97;
    }

    .blocks-container {
      padding: 0 96px 200px;
      max-width: 900px;
      margin: 0 auto;
      position: relative;
    }

    .add-block {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 8px;
      color: #9b9a97;
      cursor: pointer;
      transition: background 0.15s ease;
      border-radius: 4px;
      margin-top: 4px;
    }

    .add-block:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .plus-icon {
      font-size: 18px;
      font-weight: 600;
    }

    .hint {
      font-size: 14px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: white;
      color: #9b9a97;
      font-size: 16px;
    }

    .drag-preview {
      position: fixed;
      background: white;
      border: 2px solid #2383e2;
      border-radius: 4px;
      padding: 8px 12px;
      pointer-events: none;
      z-index: 1000;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class PageEditorComponent implements OnChanges {
  @Input() pageId: string | null = null;
  @ViewChild('blocksContainer') blocksContainer?: ElementRef;

  currentPage: Page | null = null;
  blocks: Block[] = [];

  draggedBlock: Block | null = null;
  dragPreviewTop = 0;
  dragPreviewLeft = 0;
  dragStartY = 0;
  dragStartIndex = 0;

  constructor(private supabaseService: SupabaseService) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['pageId'] && this.pageId) {
      await this.loadPage(this.pageId);
    }
  }

  async loadPage(pageId: string) {
    try {
      this.currentPage = await this.supabaseService.getPage(pageId);
      this.blocks = await this.supabaseService.getBlocks(pageId);

      if (this.blocks.length === 0) {
        await this.addNewBlock();
      }
    } catch (error) {
      console.error('Error loading page:', error);
    }
  }

  async updatePageTitle() {
    if (this.currentPage) {
      try {
        await this.supabaseService.updatePage(this.currentPage.id, {
          title: this.currentPage.title
        });
      } catch (error) {
        console.error('Error updating page title:', error);
      }
    }
  }

  async addNewBlock() {
    if (!this.currentPage) return;

    try {
      const newBlock = await this.supabaseService.createBlock({
        page_id: this.currentPage.id,
        type: 'text',
        content: '',
        position: this.blocks.length
      });
      this.blocks.push(newBlock);
    } catch (error) {
      console.error('Error creating block:', error);
    }
  }

  async onBlockContentChanged(event: { id: string; content: string }) {
    try {
      await this.supabaseService.updateBlock(event.id, {
        content: event.content
      });

      const block = this.blocks.find(b => b.id === event.id);
      if (block) {
        block.content = event.content;
      }
    } catch (error) {
      console.error('Error updating block:', error);
    }
  }

  async onBlockTypeChanged(event: { id: string; type: string }) {
    try {
      await this.supabaseService.updateBlock(event.id, {
        type: event.type as any
      });
    } catch (error) {
      console.error('Error updating block type:', error);
    }
  }

  async onBlockDeleted(blockId: string) {
    try {
      await this.supabaseService.deleteBlock(blockId);
      this.blocks = this.blocks.filter(b => b.id !== blockId);

      await this.reorderBlocks();
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  }

  async onEnterPressed(blockId: string) {
    const index = this.blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      try {
        const newBlock = await this.supabaseService.createBlock({
          page_id: this.currentPage!.id,
          type: 'text',
          content: '',
          position: index + 1
        });

        this.blocks.splice(index + 1, 0, newBlock);
        await this.reorderBlocks();
      } catch (error) {
        console.error('Error creating block:', error);
      }
    }
  }

  onDragStart(event: MouseEvent, block: Block) {
    this.draggedBlock = block;
    this.dragStartY = event.clientY;
    this.dragStartIndex = this.blocks.indexOf(block);
    this.dragPreviewTop = event.clientY;
    this.dragPreviewLeft = event.clientX + 20;

    const onMouseMove = (e: MouseEvent) => {
      this.dragPreviewTop = e.clientY;
      this.dragPreviewLeft = e.clientX + 20;

      const deltaY = e.clientY - this.dragStartY;
      const blockHeight = 40;
      const newIndex = Math.max(
        0,
        Math.min(
          this.blocks.length - 1,
          this.dragStartIndex + Math.round(deltaY / blockHeight)
        )
      );

      if (newIndex !== this.blocks.indexOf(this.draggedBlock!)) {
        const currentIndex = this.blocks.indexOf(this.draggedBlock!);
        this.blocks.splice(currentIndex, 1);
        this.blocks.splice(newIndex, 0, this.draggedBlock!);
      }
    };

    const onMouseUp = async () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      if (this.draggedBlock) {
        await this.reorderBlocks();
      }

      this.draggedBlock = null;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  async reorderBlocks() {
    const updates = this.blocks.map((block, index) => ({
      id: block.id,
      position: index
    }));

    try {
      await this.supabaseService.reorderBlocks(updates);
      this.blocks.forEach((block, index) => {
        block.position = index;
      });
    } catch (error) {
      console.error('Error reordering blocks:', error);
    }
  }

  trackByBlockId(index: number, block: Block): string {
    return block.id;
  }
}
