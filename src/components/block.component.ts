import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Block } from '../services/supabase.service';

@Component({
  selector: 'app-block',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="block" [attr.data-block-id]="block.id">
      <div class="block-controls">
        <button class="drag-handle" (mousedown)="onDragStart($event)">⋮⋮</button>
        <select
          class="block-type-selector"
          [(ngModel)]="block.type"
          (change)="onTypeChange()"
        >
          <option value="text">Text</option>
          <option value="heading1">Heading 1</option>
          <option value="heading2">Heading 2</option>
          <option value="heading3">Heading 3</option>
          <option value="bulletlist">Bullet List</option>
          <option value="numberlist">Number List</option>
          <option value="checklist">Checklist</option>
          <option value="quote">Quote</option>
        </select>
        <button class="delete-btn" (click)="onDelete()" title="Delete block">×</button>
      </div>
      <div class="block-content" [ngSwitch]="block.type">
        <h1 *ngSwitchCase="'heading1'"
            class="editable heading1"
            contenteditable="true"
            #contentEl
            (blur)="onContentChange()"
            (keydown.enter)="onEnter($any($event))"
            [textContent]="block.content || 'Heading 1'">
        </h1>
        <h2 *ngSwitchCase="'heading2'"
            class="editable heading2"
            contenteditable="true"
            #contentEl
            (blur)="onContentChange()"
            (keydown.enter)="onEnter($any($event))"
            [textContent]="block.content || 'Heading 2'">
        </h2>
        <h3 *ngSwitchCase="'heading3'"
            class="editable heading3"
            contenteditable="true"
            #contentEl
            (blur)="onContentChange()"
            (keydown.enter)="onEnter($any($event))"
            [textContent]="block.content || 'Heading 3'">
        </h3>
        <div *ngSwitchCase="'bulletlist'" class="list-item">
          <span class="bullet">•</span>
          <div class="editable"
               contenteditable="true"
               #contentEl
               (blur)="onContentChange()"
               (keydown.enter)="onEnter($any($event))"
               [textContent]="block.content || 'List item'">
          </div>
        </div>
        <div *ngSwitchCase="'numberlist'" class="list-item">
          <span class="number">{{ block.position + 1 }}.</span>
          <div class="editable"
               contenteditable="true"
               #contentEl
               (blur)="onContentChange()"
               (keydown.enter)="onEnter($any($event))"
               [textContent]="block.content || 'List item'">
          </div>
        </div>
        <div *ngSwitchCase="'checklist'" class="list-item">
          <input type="checkbox" [(ngModel)]="checked" (change)="onCheckChange()">
          <div class="editable"
               [class.checked]="checked"
               contenteditable="true"
               #contentEl
               (blur)="onContentChange()"
               (keydown.enter)="onEnter($any($event))"
               [textContent]="block.content || 'To-do'">
          </div>
        </div>
        <blockquote *ngSwitchCase="'quote'"
                    class="editable quote"
                    contenteditable="true"
                    #contentEl
                    (blur)="onContentChange()"
                    (keydown.enter)="onEnter($any($event))"
                    [textContent]="block.content || 'Quote'">
        </blockquote>
        <p *ngSwitchDefault
           class="editable text"
           contenteditable="true"
           #contentEl
           (blur)="onContentChange()"
           (keydown.enter)="onEnter($any($event))"
           [textContent]="block.content || 'Type something...'">
        </p>
      </div>
    </div>
  `,
  styles: [`
    .block {
      position: relative;
      padding: 3px 0;
      margin: 2px 0;
      transition: background 0.1s ease;
    }

    .block:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .block:hover .block-controls {
      opacity: 1;
    }

    .block-controls {
      position: absolute;
      left: -120px;
      top: 6px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .drag-handle {
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: none;
      cursor: grab;
      color: #9b9a97;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .block-type-selector {
      padding: 2px 4px;
      font-size: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      background: white;
      color: #37352f;
      cursor: pointer;
    }

    .delete-btn {
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #9b9a97;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delete-btn:hover {
      color: #eb5757;
    }

    .block-content {
      min-height: 28px;
    }

    .editable {
      outline: none;
      padding: 3px 2px;
      min-height: 24px;
      color: #37352f;
    }

    .editable:empty:before {
      content: attr(placeholder);
      color: #9b9a97;
    }

    .heading1 {
      font-size: 36px;
      font-weight: 700;
      line-height: 1.2;
      margin: 8px 0;
    }

    .heading2 {
      font-size: 28px;
      font-weight: 600;
      line-height: 1.3;
      margin: 6px 0;
    }

    .heading3 {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.4;
      margin: 4px 0;
    }

    .text {
      font-size: 16px;
      line-height: 1.5;
      margin: 1px 0;
    }

    .list-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      font-size: 16px;
      line-height: 1.5;
      padding: 2px 0;
    }

    .bullet {
      flex-shrink: 0;
      margin-top: 3px;
      color: #37352f;
    }

    .number {
      flex-shrink: 0;
      margin-top: 3px;
      color: #37352f;
      min-width: 24px;
    }

    .list-item input[type="checkbox"] {
      flex-shrink: 0;
      margin-top: 6px;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .list-item .editable {
      flex: 1;
    }

    .checked {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .quote {
      font-size: 16px;
      line-height: 1.5;
      border-left: 3px solid #37352f;
      padding-left: 16px;
      margin: 4px 0;
      font-style: italic;
    }
  `]
})
export class BlockComponent implements AfterViewInit {
  @Input() block!: Block;
  @Output() contentChanged = new EventEmitter<{ id: string; content: string }>();
  @Output() typeChanged = new EventEmitter<{ id: string; type: string }>();
  @Output() deleted = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<string>();
  @Output() dragStarted = new EventEmitter<MouseEvent>();

  @ViewChild('contentEl') contentEl?: ElementRef;

  checked = false;

  ngAfterViewInit() {
    if (this.block.properties?.checked !== undefined) {
      this.checked = this.block.properties.checked;
    }
  }

  onContentChange() {
    if (this.contentEl) {
      const content = this.contentEl.nativeElement.textContent || '';
      this.contentChanged.emit({ id: this.block.id, content });
    }
  }

  onTypeChange() {
    this.typeChanged.emit({ id: this.block.id, type: this.block.type });
  }

  onDelete() {
    this.deleted.emit(this.block.id);
  }

  onEnter(event: KeyboardEvent) {
    event.preventDefault();
    this.onContentChange();
    this.enterPressed.emit(this.block.id);
  }

  onCheckChange() {
    const properties = { ...this.block.properties, checked: this.checked };
    this.contentChanged.emit({
      id: this.block.id,
      content: this.block.content
    });
    this.block.properties = properties;
  }

  onDragStart(event: MouseEvent) {
    this.dragStarted.emit(event);
  }
}
