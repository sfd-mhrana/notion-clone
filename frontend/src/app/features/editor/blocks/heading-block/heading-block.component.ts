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
  selector: 'app-heading-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #editable
      class="heading-block"
      [class.h1]="level === 1"
      [class.h2]="level === 2"
      [class.h3]="level === 3"
      contenteditable="true"
      [attr.placeholder]="placeholder"
      (input)="onInput($event)"
      (keydown)="onKeyDown($event)"
      (focus)="focus.emit()"
      (blur)="blur.emit()"
    ></div>
  `,
  styles: [`
    .heading-block {
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;
      font-weight: 600;
      padding: 4px 2px;
    }

    .heading-block:empty::before {
      content: attr(placeholder);
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }

    .h1 {
      font-size: 30px;
      line-height: 1.3;
      margin-top: 32px;
      margin-bottom: 4px;
    }

    .h2 {
      font-size: 24px;
      line-height: 1.3;
      margin-top: 22px;
      margin-bottom: 1px;
    }

    .h3 {
      font-size: 20px;
      line-height: 1.3;
      margin-top: 16px;
      margin-bottom: 1px;
    }
  `],
})
export class HeadingBlockComponent implements AfterViewInit, OnChanges {
  @Input() block!: Block;
  @Input() level: 1 | 2 | 3 = 1;
  @Input() focused = false;

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @Output() enter = new EventEmitter<void>();
  @Output() backspace = new EventEmitter<void>();
  @Output() slashCommand = new EventEmitter<{ position: { x: number; y: number }; filter: string }>();

  @ViewChild('editable') editableRef!: ElementRef<HTMLDivElement>;

  get placeholder(): string {
    switch (this.level) {
      case 1: return 'Heading 1';
      case 2: return 'Heading 2';
      case 3: return 'Heading 3';
      default: return 'Heading';
    }
  }

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
    if (text.startsWith('/')) {
      const rect = this.getCaretRect();
      if (rect) {
        this.slashCommand.emit({
          position: { x: rect.left, y: rect.bottom + 4 },
          filter: text.substring(1),
        });
        return;
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
