import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BlockRendererComponent } from './block-renderer/block-renderer.component';
import { SlashCommandMenuComponent } from './slash-command/slash-command-menu.component';
import { Block, BlockType, BlocksActions } from '../../store/blocks';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, BlockRendererComponent, SlashCommandMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="editor"
      (keydown)="handleKeydown($event)"
    >
      @for (block of blocks; track block.id; let i = $index) {
        <app-block-renderer
          [block]="block"
          [isSelected]="selectedBlockId() === block.id"
          (select)="selectBlock(block.id)"
          (contentChange)="onContentChange(block.id, $event)"
          (delete)="deleteBlock(block.id)"
          (slashCommand)="openSlashCommand($event, block.id)"
          (moveUp)="moveFocusUp(i)"
          (moveDown)="moveFocusDown(i)"
          (createBlockAfter)="createBlockAfter(block.id, i)"
        />
      }

      @if (blocks.length === 0) {
        <div class="empty-editor" (click)="createFirstBlock()">
          <span class="placeholder">Click here or press '/' for commands...</span>
        </div>
      }

      @if (showSlashCommand()) {
        <app-slash-command-menu
          [position]="slashCommandPosition()"
          [filter]="slashCommandFilter()"
          (select)="onSlashCommandSelect($event)"
          (close)="closeSlashCommand()"
        />
      }
    </div>
  `,
  styles: [`
    .editor {
      max-width: 900px;
      margin: 0 auto;
      padding: 48px 96px;
      min-height: 100vh;
      outline: none;
    }

    .empty-editor {
      padding: 8px 4px;
      cursor: text;
    }

    .placeholder {
      color: #999;
    }
  `],
})
export class EditorComponent {
  private readonly store = inject(Store);

  @Input() blocks: Block[] = [];
  @Input() pageId: string = '';

  @Output() blockChange = new EventEmitter<{ blockId: string; content: Record<string, unknown> }>();

  readonly selectedBlockId = signal<string | null>(null);
  readonly showSlashCommand = signal(false);
  readonly slashCommandPosition = signal({ top: 0, left: 0 });
  readonly slashCommandFilter = signal('');
  private slashCommandBlockId: string | null = null;

  selectBlock(blockId: string): void {
    this.selectedBlockId.set(blockId);
  }

  onContentChange(blockId: string, content: Record<string, unknown>): void {
    this.blockChange.emit({ blockId, content });
  }

  deleteBlock(blockId: string): void {
    this.store.dispatch(BlocksActions.deleteBlock({ id: blockId }));
  }

  createBlockAfter(afterBlockId: string, index: number): void {
    const order = this.blocks[index]?.order ?? 0;
    const nextOrder = this.blocks[index + 1]?.order ?? order + 100;
    const newOrder = Math.floor((order + nextOrder) / 2);

    this.store.dispatch(BlocksActions.createBlock({
      pageId: this.pageId,
      data: {
        type: BlockType.PARAGRAPH,
        content: { rich_text: [] },
        order: newOrder,
      },
    }));
  }

  createFirstBlock(): void {
    this.store.dispatch(BlocksActions.createBlock({
      pageId: this.pageId,
      data: {
        type: BlockType.PARAGRAPH,
        content: { rich_text: [] },
        order: 0,
      },
    }));
  }

  moveFocusUp(currentIndex: number): void {
    if (currentIndex > 0) {
      this.selectedBlockId.set(this.blocks[currentIndex - 1].id);
    }
  }

  moveFocusDown(currentIndex: number): void {
    if (currentIndex < this.blocks.length - 1) {
      this.selectedBlockId.set(this.blocks[currentIndex + 1].id);
    }
  }

  openSlashCommand(event: { position: { top: number; left: number }; filter: string }, blockId: string): void {
    this.slashCommandBlockId = blockId;
    this.slashCommandPosition.set(event.position);
    this.slashCommandFilter.set(event.filter);
    this.showSlashCommand.set(true);
  }

  closeSlashCommand(): void {
    this.showSlashCommand.set(false);
    this.slashCommandBlockId = null;
    this.slashCommandFilter.set('');
  }

  onSlashCommandSelect(type: BlockType): void {
    if (this.slashCommandBlockId) {
      this.store.dispatch(BlocksActions.updateBlock({
        id: this.slashCommandBlockId,
        data: { type },
      }));
    }
    this.closeSlashCommand();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showSlashCommand()) {
      this.closeSlashCommand();
      event.preventDefault();
    }
  }
}
