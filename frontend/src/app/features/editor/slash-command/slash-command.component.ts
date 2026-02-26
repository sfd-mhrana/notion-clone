import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SLASH_COMMANDS, SlashCommandItem } from '../editor.models';

@Component({
  selector: 'app-slash-command',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="slash-command-menu"
      [style.left.px]="position.x"
      [style.top.px]="position.y"
    >
      <div class="menu-header">
        <span class="menu-title">Basic blocks</span>
      </div>
      <div class="menu-items">
        @for (item of filteredCommands(); track item.id; let i = $index) {
          <div
            class="menu-item"
            [class.selected]="selectedIndex() === i"
            (click)="selectCommand(item)"
            (mouseenter)="selectedIndex.set(i)"
          >
            <div class="item-icon">
              <mat-icon>{{ item.icon }}</mat-icon>
            </div>
            <div class="item-content">
              <span class="item-label">{{ item.label }}</span>
              <span class="item-description">{{ item.description }}</span>
            </div>
          </div>
        } @empty {
          <div class="no-results">
            No results found
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .slash-command-menu {
      position: fixed;
      z-index: 1000;
      background: white;
      border-radius: 6px;
      box-shadow: 0 0 0 1px rgba(15, 15, 15, 0.05), 0 3px 6px rgba(15, 15, 15, 0.1), 0 9px 24px rgba(15, 15, 15, 0.2);
      min-width: 300px;
      max-width: 320px;
      max-height: 400px;
      overflow-y: auto;
    }

    .menu-header {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(55, 53, 47, 0.09);
    }

    .menu-title {
      font-size: 11px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .menu-items {
      padding: 4px 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .menu-item:hover,
    .menu-item.selected {
      background: rgba(55, 53, 47, 0.08);
    }

    .item-icon {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 4px;
      flex-shrink: 0;
    }

    .item-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: rgba(55, 53, 47, 0.8);
    }

    .item-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .item-label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.9);
    }

    .item-description {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .no-results {
      padding: 16px;
      text-align: center;
      color: rgba(55, 53, 47, 0.5);
      font-size: 14px;
    }
  `],
})
export class SlashCommandComponent implements OnInit, OnDestroy {
  @Input() position = { x: 0, y: 0 };
  @Input() set filter(value: string) {
    this._filter.set(value.toLowerCase());
    this.selectedIndex.set(0);
  }

  @Output() commandSelect = new EventEmitter<SlashCommandItem>();
  @Output() close = new EventEmitter<void>();

  private _filter = signal('');
  readonly selectedIndex = signal(0);

  readonly filteredCommands = computed(() => {
    const filter = this._filter();
    if (!filter) return SLASH_COMMANDS;

    return SLASH_COMMANDS.filter(cmd =>
      cmd.label.toLowerCase().includes(filter) ||
      cmd.keywords.some(k => k.toLowerCase().includes(filter))
    );
  });

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    // Position adjustment if menu goes off screen
    setTimeout(() => this.adjustPosition(), 0);
  }

  ngOnDestroy(): void {}

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const commands = this.filteredCommands();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.set((this.selectedIndex() + 1) % commands.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.set((this.selectedIndex() - 1 + commands.length) % commands.length);
        break;
      case 'Enter':
        event.preventDefault();
        if (commands.length > 0) {
          this.selectCommand(commands[this.selectedIndex()]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close.emit();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  }

  selectCommand(command: SlashCommandItem): void {
    this.commandSelect.emit(command);
  }

  private adjustPosition(): void {
    const menu = this.elementRef.nativeElement.querySelector('.slash-command-menu');
    if (!menu) return;

    const rect = menu.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Adjust if going off bottom
    if (rect.bottom > viewportHeight) {
      this.position = {
        ...this.position,
        y: this.position.y - rect.height - 20,
      };
    }

    // Adjust if going off right
    if (rect.right > viewportWidth) {
      this.position = {
        ...this.position,
        x: viewportWidth - rect.width - 16,
      };
    }
  }
}
