import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { PageTreeNode } from '../../../store/pages';

@Component({
  selector: 'app-page-tree-node',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="tree-node"
      [class.selected]="page.id === selectedPageId"
      [style.padding-left.px]="depth * 16 + 12"
    >
      <button
        class="expand-button"
        [class.hidden]="!hasChildren"
        (click)="toggleExpanded($event)"
      >
        <mat-icon>{{ expanded() ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>

      <button class="page-button" (click)="select()">
        <span class="page-icon">{{ page.icon || '📄' }}</span>
        <span class="page-title">{{ page.title }}</span>
      </button>

      <div class="actions">
        <button
          class="action-icon"
          [matMenuTriggerFor]="pageMenu"
          (click)="$event.stopPropagation()"
        >
          <mat-icon>more_horiz</mat-icon>
        </button>
        <button class="action-icon" (click)="addChildPage($event)">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <mat-menu #pageMenu="matMenu">
        <button mat-menu-item (click)="delete()">
          <mat-icon>delete_outline</mat-icon>
          Delete
        </button>
        <button mat-menu-item (click)="duplicate()">
          <mat-icon>content_copy</mat-icon>
          Duplicate
        </button>
      </mat-menu>
    </div>

    @if (expanded() && hasChildren) {
      @for (child of page.children; track child.id) {
        <app-page-tree-node
          [page]="child"
          [selectedPageId]="selectedPageId"
          [depth]="depth + 1"
          (pageSelected)="pageSelected.emit($event)"
          (pageDeleted)="pageDeleted.emit($event)"
          (createChildPage)="createChildPage.emit($event)"
        />
      }
    }
  `,
  styles: [`
    .tree-node {
      display: flex;
      align-items: center;
      height: 28px;
      padding-right: 8px;
      cursor: pointer;
      position: relative;
    }

    .tree-node:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .tree-node.selected {
      background: rgba(0, 0, 0, 0.08);
    }

    .expand-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #666;
      flex-shrink: 0;
    }

    .expand-button:hover {
      background: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
    }

    .expand-button.hidden {
      visibility: hidden;
    }

    .expand-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .page-button {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      text-align: left;
    }

    .page-icon {
      font-size: 14px;
      margin-right: 6px;
      flex-shrink: 0;
    }

    .page-title {
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #333;
    }

    .actions {
      display: none;
      gap: 2px;
    }

    .tree-node:hover .actions {
      display: flex;
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #666;
      border-radius: 4px;
    }

    .action-icon:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    .action-icon mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `],
})
export class PageTreeNodeComponent {
  @Input() page!: PageTreeNode;
  @Input() selectedPageId: string | null = null;
  @Input() depth = 0;

  @Output() pageSelected = new EventEmitter<string>();
  @Output() pageDeleted = new EventEmitter<string>();
  @Output() createChildPage = new EventEmitter<string>();

  readonly expanded = signal(false);

  get hasChildren(): boolean {
    return this.page.children && this.page.children.length > 0;
  }

  toggleExpanded(event: Event): void {
    event.stopPropagation();
    this.expanded.update((v) => !v);
  }

  select(): void {
    this.pageSelected.emit(this.page.id);
  }

  delete(): void {
    this.pageDeleted.emit(this.page.id);
  }

  duplicate(): void {
    // Will be implemented with store action
  }

  addChildPage(event: Event): void {
    event.stopPropagation();
    this.createChildPage.emit(this.page.id);
    this.expanded.set(true);
  }
}
