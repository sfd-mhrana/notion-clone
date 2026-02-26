import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block, BlockContent } from '../../editor.models';

@Component({
  selector: 'app-text-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #editable
      class="text-block"
      contenteditable="true"
      [attr.placeholder]="placeholder"
      [class.empty]="isEmpty"
      (input)="onInput($event)"
      (keydown)="onKeyDown($event)"
      (focus)="focus.emit()"
      (blur)="blur.emit()"
      (mouseup)="onMouseUp()"
    ></div>
  `,
  styles: [`
    .text-block {
      min-height: 24px;
      padding: 4px 2px;
      font-size: 16px;
      line-height: 1.5;
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .text-block:empty::before {
      content: attr(placeholder);
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }

    .text-block.empty::before {
      content: attr(placeholder);
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }
  `],
})
export class TextBlockComponent implements AfterViewInit, OnChanges {
  @Input() block!: Block;
  @Input() focused = false;
  @Input() placeholder = "Type '/' for commands...";

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @Output() enter = new EventEmitter<void>();
  @Output() backspace = new EventEmitter<void>();
  @Output() slashCommand = new EventEmitter<{ position: { x: number; y: number }; filter: string }>();
  @Output() selectionChange = new EventEmitter<{ text: string; rect: DOMRect } | null>();

  @ViewChild('editable') editableRef!: ElementRef<HTMLDivElement>;

  get isEmpty(): boolean {
    return !this.block.content.rich_text?.length;
  }

  private slashCommandStart = -1;

  ngAfterViewInit(): void {
    this.updateContent();
    if (this.focused) {
      this.focusElement();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['focused'] && this.focused && this.editableRef) {
      this.focusElement();
    }
  }

  private updateContent(): void {
    if (this.editableRef?.nativeElement) {
      const text = this.getPlainText();
      if (this.editableRef.nativeElement.innerText !== text) {
        this.editableRef.nativeElement.innerText = text;
      }
    }
  }

  private getPlainText(): string {
    if (!this.block.content.rich_text) return '';
    return this.block.content.rich_text.map(rt => rt.plain_text).join('');
  }

  private focusElement(): void {
    setTimeout(() => {
      const el = this.editableRef?.nativeElement;
      if (el) {
        el.focus();
        // Move cursor to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLDivElement;
    const text = target.innerText;

    // Check for slash command
    const cursorPos = this.getCursorPosition();
    const textBeforeCursor = text.substring(0, cursorPos);
    const slashIndex = textBeforeCursor.lastIndexOf('/');

    if (slashIndex !== -1 && (slashIndex === 0 || text[slashIndex - 1] === ' ' || text[slashIndex - 1] === '\n')) {
      const filter = textBeforeCursor.substring(slashIndex + 1);
      if (!filter.includes(' ')) {
        const rect = this.getCaretRect();
        if (rect) {
          this.slashCommand.emit({
            position: { x: rect.left, y: rect.bottom + 4 },
            filter,
          });
          this.slashCommandStart = slashIndex;
          return;
        }
      }
    }

    this.emitContentChange(text);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enter.emit();
    } else if (event.key === 'Backspace') {
      const text = this.editableRef.nativeElement.innerText;
      const cursorPos = this.getCursorPosition();
      if (cursorPos === 0 && text.length === 0) {
        event.preventDefault();
        this.backspace.emit();
      }
    }
  }

  onMouseUp(): void {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.selectionChange.emit({ text: selection.toString(), rect });
    } else {
      this.selectionChange.emit(null);
    }
  }

  private getCursorPosition(): number {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.editableRef.nativeElement);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  private getCaretRect(): DOMRect | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    return range.getBoundingClientRect();
  }

  private emitContentChange(text: string): void {
    const content: BlockContent = {
      rich_text: text ? [{
        type: 'text',
        text: { text },
        annotations: {},
        plain_text: text,
      }] : [],
    };
    this.contentChange.emit(content);
  }
}
