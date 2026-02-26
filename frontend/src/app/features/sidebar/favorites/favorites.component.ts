import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

export interface FavoritePage {
  id: string;
  title: string;
  icon: string;
  workspaceId: string;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="favorites-section">
      <div class="section-header" (click)="toggleExpanded()">
        <mat-icon class="expand-icon" [class.expanded]="expanded()">
          chevron_right
        </mat-icon>
        <span class="section-title">Favorites</span>
      </div>

      @if (expanded()) {
        <div
          class="favorites-list"
          cdkDropList
          (cdkDropListDropped)="onDrop($event)"
        >
          @for (page of favorites; track page.id) {
            <div
              class="favorite-item"
              cdkDrag
              [class.active]="selectedPageId === page.id"
              (click)="pageClick.emit(page)"
            >
              <span class="page-icon">{{ page.icon || '📄' }}</span>
              <span class="page-title">{{ page.title || 'Untitled' }}</span>
              <button
                class="remove-btn"
                (click)="removeFavorite($event, page)"
                title="Remove from favorites"
              >
                <mat-icon>star</mat-icon>
              </button>
            </div>
          } @empty {
            <div class="empty-state">
              <span>No favorites yet</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .favorites-section {
      padding: 4px 0;
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

    .section-title {
      font-size: 12px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .favorites-list {
      padding: 2px 0;
    }

    .favorite-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 28px;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .favorite-item:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .favorite-item.active {
      background: rgba(55, 53, 47, 0.08);
    }

    .page-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .page-title {
      flex: 1;
      font-size: 14px;
      color: rgba(55, 53, 47, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .remove-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #f5c542;
      opacity: 0;
      transition: opacity 0.1s ease;
    }

    .favorite-item:hover .remove-btn {
      opacity: 1;
    }

    .remove-btn:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .remove-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-state {
      padding: 8px 28px;
      font-size: 12px;
      color: rgba(55, 53, 47, 0.4);
    }

    /* Drag styles */
    .cdk-drag-preview {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }

    .cdk-drag-placeholder {
      opacity: 0.5;
    }
  `],
})
export class FavoritesComponent {
  @Input() favorites: FavoritePage[] = [];
  @Input() selectedPageId: string | null = null;

  @Output() pageClick = new EventEmitter<FavoritePage>();
  @Output() removeFavoriteClick = new EventEmitter<FavoritePage>();
  @Output() reorder = new EventEmitter<FavoritePage[]>();

  readonly expanded = signal(true);

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }

  removeFavorite(event: Event, page: FavoritePage): void {
    event.stopPropagation();
    this.removeFavoriteClick.emit(page);
  }

  onDrop(event: CdkDragDrop<FavoritePage[]>): void {
    const reordered = [...this.favorites];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.reorder.emit(reordered);
  }
}
