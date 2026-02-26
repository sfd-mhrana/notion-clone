import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BlockType } from '../../../store/blocks';

interface CommandItem {
  type: BlockType;
  name: string;
  description: string;
  icon: string;
  group: string;
}

const COMMANDS: CommandItem[] = [
  { type: BlockType.PARAGRAPH, name: 'Text', description: 'Plain text block', icon: 'text_fields', group: 'Basic' },
  { type: BlockType.HEADING_1, name: 'Heading 1', description: 'Large heading', icon: 'title', group: 'Basic' },
  { type: BlockType.HEADING_2, name: 'Heading 2', description: 'Medium heading', icon: 'title', group: 'Basic' },
  { type: BlockType.HEADING_3, name: 'Heading 3', description: 'Small heading', icon: 'title', group: 'Basic' },
  { type: BlockType.BULLETED_LIST, name: 'Bullet List', description: 'Bulleted list item', icon: 'format_list_bulleted', group: 'Lists' },
  { type: BlockType.NUMBERED_LIST, name: 'Numbered List', description: 'Numbered list item', icon: 'format_list_numbered', group: 'Lists' },
  { type: BlockType.TODO, name: 'To-do', description: 'Checkbox item', icon: 'check_box', group: 'Lists' },
  { type: BlockType.TOGGLE, name: 'Toggle', description: 'Collapsible content', icon: 'expand_more', group: 'Lists' },
  { type: BlockType.QUOTE, name: 'Quote', description: 'Quoted text', icon: 'format_quote', group: 'Media' },
  { type: BlockType.CALLOUT, name: 'Callout', description: 'Highlighted block', icon: 'lightbulb', group: 'Media' },
  { type: BlockType.CODE, name: 'Code', description: 'Code snippet', icon: 'code', group: 'Media' },
  { type: BlockType.DIVIDER, name: 'Divider', description: 'Horizontal line', icon: 'horizontal_rule', group: 'Media' },
  { type: BlockType.IMAGE, name: 'Image', description: 'Upload or embed image', icon: 'image', group: 'Media' },
];

@Component({
  selector: 'app-slash-command-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="slash-menu"
      [style.top.px]="position.top"
      [style.left.px]="position.left"
    >
      <div class="menu-header">
        <span>Basic blocks</span>
      </div>
      <div class="menu-items">
        @for (item of filteredCommands(); track item.type; let i = $index) {
          <button
            class="menu-item"
            [class.selected]="i === selectedIndex()"
            (click)="selectItem(item)"
            (mouseenter)="selectedIndex.set(i)"
          >
            <mat-icon class="item-icon">{{ item.icon }}</mat-icon>
            <div class="item-content">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-description">{{ item.description }}</div>
            </div>
          </button>
        }
        @if (filteredCommands().length === 0) {
          <div class="no-results">No results</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .slash-menu {
      position: fixed;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      width: 320px;
      max-height: 400px;
      overflow: hidden;
      z-index: 1000;
    }

    .menu-header {
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      border-bottom: 1px solid #eee;
    }

    .menu-items {
      max-height: 340px;
      overflow-y: auto;
      padding: 4px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
      border-radius: 4px;
    }

    .menu-item:hover,
    .menu-item.selected {
      background: #f5f5f5;
    }

    .item-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .item-content {
      flex: 1;
    }

    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .item-description {
      font-size: 12px;
      color: #999;
    }

    .no-results {
      padding: 16px;
      text-align: center;
      color: #999;
    }
  `],
})
export class SlashCommandMenuComponent {
  @Input() position = { top: 0, left: 0 };
  @Input() filter = '';

  @Output() select = new EventEmitter<BlockType>();
  @Output() close = new EventEmitter<void>();

  readonly selectedIndex = signal(0);

  readonly filteredCommands = computed(() => {
    if (!this.filter) return COMMANDS;
    const lower = this.filter.toLowerCase();
    return COMMANDS.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
    );
  });

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const commands = this.filteredCommands();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.min(i + 1, commands.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (commands.length > 0) {
          this.selectItem(commands[this.selectedIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close.emit();
        break;
    }
  }

  selectItem(item: CommandItem): void {
    this.select.emit(item.type);
  }
}
