import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/dialogs/confirm-dialog/confirm-dialog.component';

export interface TrashPage {
  id: string;
  title: string;
  icon: string;
  deletedAt: string;
  workspaceId: string;
}

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="trash-section">
      <div class="section-header" (click)="toggleExpanded()">
        <mat-icon class="expand-icon" [class.expanded]="expanded()">
          chevron_right
        </mat-icon>
        <mat-icon class="trash-icon">delete</mat-icon>
        <span class="section-title">Trash</span>
        @if (trashPages.length > 0) {
          <span class="trash-count">{{ trashPages.length }}</span>
        }
      </div>

      @if (expanded()) {
        <div class="trash-list">
          @for (page of trashPages; track page.id) {
            <div class="trash-item">
              <span class="page-icon">{{ page.icon || '📄' }}</span>
              <span class="page-title">{{ page.title || 'Untitled' }}</span>
              <span class="deleted-date">{{ formatDate(page.deletedAt) }}</span>
              <div class="item-actions">
                <button
                  class="action-btn"
                  (click)="restorePage(page)"
                  title="Restore"
                >
                  <mat-icon>restore</mat-icon>
                </button>
                <button
                  class="action-btn delete-btn"
                  (click)="deletePermanently(page)"
                  title="Delete permanently"
                >
                  <mat-icon>delete_forever</mat-icon>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>delete_outline</mat-icon>
              <span>Trash is empty</span>
            </div>
          }
        </div>

        @if (trashPages.length > 0) {
          <div class="trash-actions">
            <button class="empty-trash-btn" (click)="emptyTrash()">
              <mat-icon>delete_sweep</mat-icon>
              Empty trash
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .trash-section {
      padding: 4px 0;
      border-top: 1px solid rgba(55, 53, 47, 0.09);
      margin-top: 8px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      cursor: pointer;
      user-select: none;
    }

    .section-header:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .expand-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(55, 53, 47, 0.5);
      transition: transform 0.15s ease;
    }

    .expand-icon.expanded {
      transform: rotate(90deg);
    }

    .trash-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(55, 53, 47, 0.5);
    }

    .section-title {
      flex: 1;
      font-size: 14px;
      color: rgba(55, 53, 47, 0.9);
    }

    .trash-count {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
      padding: 2px 6px;
      background: rgba(55, 53, 47, 0.08);
      border-radius: 10px;
    }

    .trash-list {
      padding: 4px 0;
      max-height: 300px;
      overflow-y: auto;
    }

    .trash-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 28px;
      transition: background 0.1s ease;
    }

    .trash-item:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .page-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .page-title {
      flex: 1;
      font-size: 14px;
      color: rgba(55, 53, 47, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .deleted-date {
      font-size: 11px;
      color: rgba(55, 53, 47, 0.4);
      flex-shrink: 0;
    }

    .item-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.1s ease;
    }

    .trash-item:hover .item-actions {
      opacity: 1;
    }

    .action-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(55, 53, 47, 0.5);
    }

    .action-btn:hover {
      background: rgba(55, 53, 47, 0.08);
      color: rgba(55, 53, 47, 0.8);
    }

    .action-btn.delete-btn:hover {
      color: #e03e3e;
    }

    .action-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: rgba(55, 53, 47, 0.4);
    }

    .empty-state mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
    }

    .empty-state span {
      font-size: 13px;
    }

    .trash-actions {
      padding: 8px 12px;
      border-top: 1px solid rgba(55, 53, 47, 0.09);
    }

    .empty-trash-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #e03e3e;
      font-size: 13px;
    }

    .empty-trash-btn:hover {
      background: rgba(224, 62, 62, 0.08);
    }

    .empty-trash-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class TrashComponent {
  @Input() trashPages: TrashPage[] = [];

  @Output() restore = new EventEmitter<TrashPage>();
  @Output() deleteForever = new EventEmitter<TrashPage>();
  @Output() emptyAll = new EventEmitter<void>();

  readonly expanded = signal(false);

  constructor(private dialog: MatDialog) {}

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    return date.toLocaleDateString();
  }

  restorePage(page: TrashPage): void {
    this.restore.emit(page);
  }

  deletePermanently(page: TrashPage): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Permanently',
        message: `Are you sure you want to permanently delete "${page.title || 'Untitled'}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.deleteForever.emit(page);
      }
    });
  }

  emptyTrash(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Empty Trash',
        message: 'Are you sure you want to permanently delete all items in trash? This cannot be undone.',
        confirmLabel: 'Empty Trash',
        confirmColor: 'warn',
        icon: 'delete_sweep',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.emptyAll.emit();
      }
    });
  }
}
