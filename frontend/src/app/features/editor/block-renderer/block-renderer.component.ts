import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Block, BlockType } from '../../../store/blocks';
import { TextBlockComponent } from '../text-block/text-block.component';
import { BlockToolbarComponent } from '../block-toolbar/block-toolbar.component';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    TextBlockComponent,
    BlockToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="block-wrapper"
      [class.selected]="isSelected"
      (click)="select.emit()"
    >
      <app-block-toolbar
        [block]="block"
        (delete)="delete.emit()"
        (duplicate)="duplicate.emit()"
      />

      <div class="block-content">
        @switch (block.type) {
          @case ('paragraph') {
            <app-text-block
              [block]="block"
              [tag]="'p'"
              (contentChange)="contentChange.emit($event)"
              (slashCommand)="slashCommand.emit($event)"
              (enterPressed)="createBlockAfter.emit()"
              (backspaceOnEmpty)="delete.emit()"
              (arrowUp)="moveUp.emit()"
              (arrowDown)="moveDown.emit()"
            />
          }
          @case ('heading_1') {
            <app-text-block
              [block]="block"
              [tag]="'h1'"
              [placeholder]="'Heading 1'"
              (contentChange)="contentChange.emit($event)"
              (slashCommand)="slashCommand.emit($event)"
              (enterPressed)="createBlockAfter.emit()"
              (backspaceOnEmpty)="delete.emit()"
              (arrowUp)="moveUp.emit()"
              (arrowDown)="moveDown.emit()"
            />
          }
          @case ('heading_2') {
            <app-text-block
              [block]="block"
              [tag]="'h2'"
              [placeholder]="'Heading 2'"
              (contentChange)="contentChange.emit($event)"
              (slashCommand)="slashCommand.emit($event)"
              (enterPressed)="createBlockAfter.emit()"
              (backspaceOnEmpty)="delete.emit()"
              (arrowUp)="moveUp.emit()"
              (arrowDown)="moveDown.emit()"
            />
          }
          @case ('heading_3') {
            <app-text-block
              [block]="block"
              [tag]="'h3'"
              [placeholder]="'Heading 3'"
              (contentChange)="contentChange.emit($event)"
              (slashCommand)="slashCommand.emit($event)"
              (enterPressed)="createBlockAfter.emit()"
              (backspaceOnEmpty)="delete.emit()"
              (arrowUp)="moveUp.emit()"
              (arrowDown)="moveDown.emit()"
            />
          }
          @case ('bulleted_list_item') {
            <div class="list-block">
              <span class="list-marker">•</span>
              <app-text-block
                [block]="block"
                [tag]="'div'"
                (contentChange)="contentChange.emit($event)"
                (slashCommand)="slashCommand.emit($event)"
                (enterPressed)="createBlockAfter.emit()"
                (backspaceOnEmpty)="delete.emit()"
                (arrowUp)="moveUp.emit()"
                (arrowDown)="moveDown.emit()"
              />
            </div>
          }
          @case ('numbered_list_item') {
            <div class="list-block">
              <span class="list-marker numbered">1.</span>
              <app-text-block
                [block]="block"
                [tag]="'div'"
                (contentChange)="contentChange.emit($event)"
                (slashCommand)="slashCommand.emit($event)"
                (enterPressed)="createBlockAfter.emit()"
                (backspaceOnEmpty)="delete.emit()"
                (arrowUp)="moveUp.emit()"
                (arrowDown)="moveDown.emit()"
              />
            </div>
          }
          @case ('to_do') {
            <div class="todo-block">
              <input
                type="checkbox"
                [checked]="block.content['checked']"
                (change)="toggleTodo($event)"
                class="todo-checkbox"
              />
              <app-text-block
                [block]="block"
                [tag]="'div'"
                [class.checked]="block.content['checked']"
                (contentChange)="contentChange.emit($event)"
                (slashCommand)="slashCommand.emit($event)"
                (enterPressed)="createBlockAfter.emit()"
                (backspaceOnEmpty)="delete.emit()"
                (arrowUp)="moveUp.emit()"
                (arrowDown)="moveDown.emit()"
              />
            </div>
          }
          @case ('quote') {
            <blockquote class="quote-block">
              <app-text-block
                [block]="block"
                [tag]="'div'"
                [placeholder]="'Quote'"
                (contentChange)="contentChange.emit($event)"
                (slashCommand)="slashCommand.emit($event)"
                (enterPressed)="createBlockAfter.emit()"
                (backspaceOnEmpty)="delete.emit()"
                (arrowUp)="moveUp.emit()"
                (arrowDown)="moveDown.emit()"
              />
            </blockquote>
          }
          @case ('code') {
            <pre class="code-block"><code>{{ getTextContent() }}</code></pre>
          }
          @case ('divider') {
            <hr class="divider-block" />
          }
          @case ('callout') {
            <div class="callout-block">
              <span class="callout-icon">{{ block.content['icon'] || '💡' }}</span>
              <app-text-block
                [block]="block"
                [tag]="'div'"
                (contentChange)="contentChange.emit($event)"
                (slashCommand)="slashCommand.emit($event)"
                (enterPressed)="createBlockAfter.emit()"
                (backspaceOnEmpty)="delete.emit()"
                (arrowUp)="moveUp.emit()"
                (arrowDown)="moveDown.emit()"
              />
            </div>
          }
          @default {
            <app-text-block
              [block]="block"
              [tag]="'p'"
              (contentChange)="contentChange.emit($event)"
              (slashCommand)="slashCommand.emit($event)"
              (enterPressed)="createBlockAfter.emit()"
              (backspaceOnEmpty)="delete.emit()"
              (arrowUp)="moveUp.emit()"
              (arrowDown)="moveDown.emit()"
            />
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .block-wrapper {
      position: relative;
      display: flex;
      align-items: flex-start;
      padding: 3px 0;
      margin: 1px 0;
      border-radius: 4px;
    }

    .block-wrapper:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .block-wrapper.selected {
      background: rgba(35, 131, 226, 0.08);
    }

    .block-content {
      flex: 1;
      min-width: 0;
    }

    .list-block {
      display: flex;
      align-items: flex-start;
    }

    .list-marker {
      width: 24px;
      flex-shrink: 0;
      color: #333;
      padding-top: 3px;
    }

    .list-marker.numbered {
      font-size: 14px;
    }

    .todo-block {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .todo-checkbox {
      margin-top: 4px;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .todo-block .checked {
      text-decoration: line-through;
      color: #999;
    }

    .quote-block {
      margin: 0;
      padding-left: 16px;
      border-left: 3px solid #333;
    }

    .code-block {
      background: #f7f6f3;
      padding: 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      overflow-x: auto;
      margin: 0;
    }

    .divider-block {
      border: none;
      border-top: 1px solid #e5e5e5;
      margin: 16px 0;
    }

    .callout-block {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f7f6f3;
      padding: 16px;
      border-radius: 4px;
    }

    .callout-icon {
      font-size: 20px;
    }
  `],
})
export class BlockRendererComponent {
  @Input() block!: Block;
  @Input() isSelected = false;

  @Output() select = new EventEmitter<void>();
  @Output() contentChange = new EventEmitter<Record<string, unknown>>();
  @Output() delete = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
  @Output() slashCommand = new EventEmitter<{ position: { top: number; left: number }; filter: string }>();
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();
  @Output() createBlockAfter = new EventEmitter<void>();

  getTextContent(): string {
    const richText = this.block.content['rich_text'] as Array<{ plain_text?: string; text?: string }> | undefined;
    return richText?.map((r) => r.plain_text || r.text || '').join('') || '';
  }

  toggleTodo(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.contentChange.emit({
      ...this.block.content,
      checked,
    });
  }
}
