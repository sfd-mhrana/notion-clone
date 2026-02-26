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
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Block, BlockContent, PROGRAMMING_LANGUAGES } from '../../editor.models';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <div class="code-header">
        <mat-select
          class="language-select"
          [value]="language"
          (selectionChange)="onLanguageChange($event.value)"
        >
          @for (lang of languages; track lang.id) {
            <mat-option [value]="lang.id">{{ lang.name }}</mat-option>
          }
        </mat-select>
        <button class="copy-btn" mat-icon-button (click)="copyCode()" title="Copy code">
          <mat-icon>content_copy</mat-icon>
        </button>
      </div>
      <pre class="code-pre"><code
        #editable
        class="code-content"
        contenteditable="true"
        spellcheck="false"
        (input)="onInput($event)"
        (keydown)="onKeyDown($event)"
        (focus)="focus.emit()"
        (blur)="blur.emit()"
      ></code></pre>
    </div>
  `,
  styles: [`
    .code-block {
      background: rgb(247, 246, 243);
      border-radius: 4px;
      margin: 4px 0;
      overflow: hidden;
    }

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(55, 53, 47, 0.04);
      border-bottom: 1px solid rgba(55, 53, 47, 0.09);
    }

    .language-select {
      font-size: 12px;
      min-width: 120px;
    }

    ::ng-deep .language-select .mat-mdc-select-trigger {
      font-size: 12px;
    }

    .copy-btn {
      width: 32px;
      height: 32px;
    }

    .copy-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .code-pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;
    }

    .code-content {
      display: block;
      font-family: 'SFMono-Regular', Menlo, Consolas, 'PT Mono', 'Liberation Mono', Courier, monospace;
      font-size: 14px;
      line-height: 1.5;
      outline: none;
      white-space: pre;
      min-height: 24px;
      color: #1a1a1a;
    }

    .code-content:empty::before {
      content: '// Your code here...';
      color: rgba(55, 53, 47, 0.4);
      pointer-events: none;
    }
  `],
})
export class CodeBlockComponent implements AfterViewInit, OnChanges {
  @Input() block!: Block;
  @Input() focused = false;

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() languageChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  @ViewChild('editable') editableRef!: ElementRef<HTMLElement>;

  readonly languages = PROGRAMMING_LANGUAGES;

  get language(): string {
    return this.block.content.language || 'javascript';
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

  onLanguageChange(language: string): void {
    this.languageChange.emit(language);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLElement;
    const text = target.innerText;
    this.emitContentChange(text);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Allow Tab for indentation in code blocks
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  }

  copyCode(): void {
    const text = this.getPlainText();
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log('Code copied to clipboard');
    });
  }

  private emitContentChange(text: string): void {
    const content: BlockContent = {
      ...this.block.content,
      rich_text: text ? [{ type: 'text', text: { text }, annotations: {}, plain_text: text }] : [],
    };
    this.contentChange.emit(content);
  }
}
