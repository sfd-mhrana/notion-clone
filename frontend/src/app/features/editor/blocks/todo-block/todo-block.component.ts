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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Block, BlockContent } from '../../editor.models';

@Component({
  selector: 'app-todo-block',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="todo-block" [class.checked]="isChecked">
      <mat-checkbox
        class="todo-checkbox"
        [checked]="isChecked"
        (change)="onCheckChange($event.checked)"
      ></mat-checkbox>
      <div
        #editable
        class="todo-content"
        contenteditable="true"
        placeholder="To-do"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="focus.emit()"
        (blur)="blur.emit()"
      ></div>
    </div>
  `,
  styles: [`
    .todo-block {
      display: flex;
      align-items: flex-start;
      padding: 4px 2px;
      gap: 8px;
    }

    .todo-checkbox {
      margin-top: 2px;
    }

    .todo-content {
      flex: 1;
      min-height: 24px;
      font-size: 16px;
      line-height: 1.5;
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .todo-content:empty::before {
      content: attr(placeholder);
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }

    .todo-block.checked .todo-content {
      text-decoration: line-through;
      color: rgba(55, 53, 47, 0.5);
    }
  `],
})
export class TodoBlockComponent implements AfterViewInit, OnChanges {
  @Input() block!: Block;
  @Input() focused = false;

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @Output() enter = new EventEmitter<void>();
  @Output() backspace = new EventEmitter<void>();
  @Output() slashCommand = new EventEmitter<{ position: { x: number; y: number }; filter: string }>();

  @ViewChild('editable') editableRef!: ElementRef<HTMLDivElement>;

  get isChecked(): boolean {
    return this.block.content.checked ?? false;
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

  onCheckChange(checked: boolean): void {
    this.checkedChange.emit(checked);
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
      ...this.block.content,
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
