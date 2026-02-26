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
  selector: 'app-callout-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callout-block" [style.background]="backgroundColor">
      <button class="callout-icon" (click)="onIconClick()">
        {{ icon }}
      </button>
      <div
        #editable
        class="callout-content"
        contenteditable="true"
        placeholder="Type something..."
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="focus.emit()"
        (blur)="blur.emit()"
      ></div>
    </div>
  `,
  styles: [`
    .callout-block {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-radius: 4px;
      margin: 4px 0;
      gap: 8px;
    }

    .callout-icon {
      font-size: 24px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .callout-icon:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .callout-content {
      flex: 1;
      min-height: 24px;
      font-size: 16px;
      line-height: 1.5;
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .callout-content:empty::before {
      content: attr(placeholder);
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }
  `],
})
export class CalloutBlockComponent implements AfterViewInit, OnChanges {
  @Input() block!: Block;
  @Input() focused = false;

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() iconChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @Output() enter = new EventEmitter<void>();
  @Output() backspace = new EventEmitter<void>();
  @Output() slashCommand = new EventEmitter<{ position: { x: number; y: number }; filter: string }>();

  @ViewChild('editable') editableRef!: ElementRef<HTMLDivElement>;

  private readonly defaultIcons = ['💡', '⚠️', '📌', '💬', '❓', '✅', '❌', '🔥', '📝', '🎯'];

  get icon(): string {
    return this.block.content.icon || '💡';
  }

  get backgroundColor(): string {
    return this.block.content.color || 'rgba(241, 241, 239, 1)';
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

  onIconClick(): void {
    const currentIndex = this.defaultIcons.indexOf(this.icon);
    const nextIndex = (currentIndex + 1) % this.defaultIcons.length;
    this.iconChange.emit(this.defaultIcons[nextIndex]);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLDivElement;
    const text = target.innerText;

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
    return selection.getRangeAt(0).getBoundingClientRect();
  }

  private emitContentChange(text: string): void {
    const content: BlockContent = {
      ...this.block.content,
      rich_text: text ? [{ type: 'text', text: { text }, annotations: {}, plain_text: text }] : [],
    };
    this.contentChange.emit(content);
  }
}
