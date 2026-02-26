import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../../store/blocks';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #editable
      [attr.contenteditable]="true"
      [attr.data-placeholder]="placeholder"
      [class]="'text-block ' + tag"
      [class.empty]="isEmpty"
      (input)="onInput($event)"
      (keydown)="onKeydown($event)"
      (paste)="onPaste($event)"
    ></div>
  `,
  styles: [`
    .text-block {
      outline: none;
      min-height: 1.5em;
      line-height: 1.5;
      word-break: break-word;
    }

    .text-block.empty::before {
      content: attr(data-placeholder);
      color: #999;
      pointer-events: none;
    }

    .text-block.p {
      font-size: 16px;
    }

    .text-block.h1 {
      font-size: 30px;
      font-weight: 700;
      margin-top: 24px;
    }

    .text-block.h2 {
      font-size: 24px;
      font-weight: 600;
      margin-top: 20px;
    }

    .text-block.h3 {
      font-size: 20px;
      font-weight: 600;
      margin-top: 16px;
    }

    .text-block.div {
      font-size: 16px;
    }
  `],
})
export class TextBlockComponent implements AfterViewInit, OnChanges {
  @ViewChild('editable') editable!: ElementRef<HTMLElement>;

  @Input() block!: Block;
  @Input() tag: 'p' | 'h1' | 'h2' | 'h3' | 'div' = 'p';
  @Input() placeholder = "Type '/' for commands...";

  @Output() contentChange = new EventEmitter<Record<string, unknown>>();
  @Output() slashCommand = new EventEmitter<{ position: { top: number; left: number }; filter: string }>();
  @Output() enterPressed = new EventEmitter<void>();
  @Output() backspaceOnEmpty = new EventEmitter<void>();
  @Output() arrowUp = new EventEmitter<void>();
  @Output() arrowDown = new EventEmitter<void>();

  isEmpty = true;
  private slashPosition = -1;

  ngAfterViewInit(): void {
    this.renderContent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['block'] && this.editable) {
      this.renderContent();
    }
  }

  private renderContent(): void {
    const richText = this.block.content['rich_text'] as Array<{ plain_text?: string; text?: string }> | undefined;
    const text = richText?.map((r) => r.plain_text || r.text || '').join('') || '';
    this.editable.nativeElement.textContent = text;
    this.isEmpty = !text;
  }

  onInput(event: Event): void {
    const text = this.editable.nativeElement.textContent || '';
    this.isEmpty = !text;

    // Check for slash command
    if (text.includes('/')) {
      const slashIndex = text.lastIndexOf('/');
      if (slashIndex !== this.slashPosition) {
        this.slashPosition = slashIndex;
        const filter = text.slice(slashIndex + 1);
        const rect = this.editable.nativeElement.getBoundingClientRect();
        this.slashCommand.emit({
          position: { top: rect.bottom + 8, left: rect.left },
          filter,
        });
      }
    } else {
      this.slashPosition = -1;
    }

    this.contentChange.emit({
      ...this.block.content,
      rich_text: [{ text, annotations: {} }],
    });
  }

  onKeydown(event: KeyboardEvent): void {
    const text = this.editable.nativeElement.textContent || '';

    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault();
          this.enterPressed.emit();
        }
        break;

      case 'Backspace':
        if (!text) {
          event.preventDefault();
          this.backspaceOnEmpty.emit();
        }
        break;

      case 'ArrowUp':
        if (this.isAtStart()) {
          event.preventDefault();
          this.arrowUp.emit();
        }
        break;

      case 'ArrowDown':
        if (this.isAtEnd()) {
          event.preventDefault();
          this.arrowDown.emit();
        }
        break;
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }

  private isAtStart(): boolean {
    const selection = window.getSelection();
    return selection?.anchorOffset === 0;
  }

  private isAtEnd(): boolean {
    const selection = window.getSelection();
    const text = this.editable.nativeElement.textContent || '';
    return selection?.anchorOffset === text.length;
  }
}
