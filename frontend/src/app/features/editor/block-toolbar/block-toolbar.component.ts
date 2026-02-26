import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Block } from '../../../store/blocks';

@Component({
  selector: 'app-block-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, MatDividerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="block-toolbar">
      <button class="toolbar-button drag-handle" cdkDragHandle>
        <mat-icon>drag_indicator</mat-icon>
      </button>
      <button class="toolbar-button" [matMenuTriggerFor]="blockMenu">
        <mat-icon>add</mat-icon>
      </button>
      <mat-menu #blockMenu="matMenu">
        <button mat-menu-item (click)="delete.emit()">
          <mat-icon>delete</mat-icon>
          Delete
        </button>
        <button mat-menu-item (click)="duplicate.emit()">
          <mat-icon>content_copy</mat-icon>
          Duplicate
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item disabled>
          <mat-icon>swap_horiz</mat-icon>
          Turn into
        </button>
        <button mat-menu-item disabled>
          <mat-icon>link</mat-icon>
          Copy link
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .block-toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s;
      margin-right: 4px;
    }

    :host-context(.block-wrapper:hover) .block-toolbar {
      opacity: 1;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      color: #999;
    }

    .toolbar-button:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #333;
    }

    .toolbar-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .drag-handle {
      cursor: grab;
    }

    .drag-handle:active {
      cursor: grabbing;
    }
  `],
})
export class BlockToolbarComponent {
  @Input() block!: Block;

  @Output() delete = new EventEmitter<void>();
  @Output() duplicate = new EventEmitter<void>();
}
