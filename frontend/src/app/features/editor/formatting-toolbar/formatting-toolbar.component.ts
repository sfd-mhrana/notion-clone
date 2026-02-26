import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ElementRef,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export type FormatType = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';

@Component({
  selector: 'app-formatting-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="formatting-toolbar"
      [style.left.px]="adjustedPosition.x"
      [style.top.px]="adjustedPosition.y"
    >
      <button
        class="format-btn"
        (click)="applyFormat('bold')"
        matTooltip="Bold (Ctrl+B)"
        matTooltipPosition="above"
      >
        <mat-icon>format_bold</mat-icon>
      </button>
      <button
        class="format-btn"
        (click)="applyFormat('italic')"
        matTooltip="Italic (Ctrl+I)"
        matTooltipPosition="above"
      >
        <mat-icon>format_italic</mat-icon>
      </button>
      <button
        class="format-btn"
        (click)="applyFormat('underline')"
        matTooltip="Underline (Ctrl+U)"
        matTooltipPosition="above"
      >
        <mat-icon>format_underlined</mat-icon>
      </button>
      <button
        class="format-btn"
        (click)="applyFormat('strikethrough')"
        matTooltip="Strikethrough"
        matTooltipPosition="above"
      >
        <mat-icon>strikethrough_s</mat-icon>
      </button>
      <div class="divider"></div>
      <button
        class="format-btn"
        (click)="applyFormat('code')"
        matTooltip="Code (Ctrl+E)"
        matTooltipPosition="above"
      >
        <mat-icon>code</mat-icon>
      </button>
      <button
        class="format-btn"
        (click)="applyFormat('link')"
        matTooltip="Link (Ctrl+K)"
        matTooltipPosition="above"
      >
        <mat-icon>link</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .formatting-toolbar {
      position: fixed;
      z-index: 1001;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      background: #1a1a1a;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transform: translateX(-50%);
    }

    .formatting-toolbar::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #1a1a1a;
    }

    .format-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: white;
      transition: background 0.1s ease;
    }

    .format-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .format-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.2);
      margin: 0 4px;
    }
  `],
})
export class FormattingToolbarComponent implements OnInit {
  @Input() position = { x: 0, y: 0 };

  @Output() formatApply = new EventEmitter<FormatType>();

  adjustedPosition = { x: 0, y: 0 };

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.adjustedPosition = {
      x: this.position.x,
      y: this.position.y - 44,
    };

    // Ensure toolbar stays within viewport
    setTimeout(() => this.adjustPosition(), 0);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.applyFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          this.applyFormat('italic');
          break;
        case 'u':
          event.preventDefault();
          this.applyFormat('underline');
          break;
        case 'e':
          event.preventDefault();
          this.applyFormat('code');
          break;
        case 'k':
          event.preventDefault();
          this.applyFormat('link');
          break;
      }
    }
  }

  applyFormat(format: FormatType): void {
    // Apply formatting using document.execCommand for simplicity
    switch (format) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'underline':
        document.execCommand('underline');
        break;
      case 'strikethrough':
        document.execCommand('strikethrough');
        break;
      case 'code':
        // Wrap selection in <code> tag
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const code = document.createElement('code');
          code.style.background = 'rgba(135, 131, 120, 0.15)';
          code.style.padding = '0.2em 0.4em';
          code.style.borderRadius = '3px';
          code.style.fontFamily = 'monospace';
          range.surroundContents(code);
        }
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
    }

    this.formatApply.emit(format);
  }

  private adjustPosition(): void {
    const toolbar = this.elementRef.nativeElement.querySelector('.formatting-toolbar');
    if (!toolbar) return;

    const rect = toolbar.getBoundingClientRect();

    // Adjust if going off left
    if (rect.left < 8) {
      this.adjustedPosition = {
        ...this.adjustedPosition,
        x: rect.width / 2 + 8,
      };
    }

    // Adjust if going off right
    if (rect.right > window.innerWidth - 8) {
      this.adjustedPosition = {
        ...this.adjustedPosition,
        x: window.innerWidth - rect.width / 2 - 8,
      };
    }

    // Adjust if going off top
    if (this.adjustedPosition.y < 8) {
      this.adjustedPosition = {
        ...this.adjustedPosition,
        y: this.position.y + 30,
      };
    }
  }
}
