import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {
  DatabaseProperty,
  DatabaseRow,
  PropertyType,
  SelectOption,
} from '../database.models';

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DragDropModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board-container">
      @if (groupByProperty; as prop) {
        <div class="board-columns" cdkDropListGroup>
          @for (column of getColumns(); track column.id) {
            <div class="board-column">
              <div class="column-header">
                <span class="column-tag" [style.background]="column.color">
                  {{ column.name }}
                </span>
                <span class="column-count">{{ getColumnRows(column.id).length }}</span>
              </div>
              <div
                class="column-content"
                cdkDropList
                [cdkDropListData]="getColumnRows(column.id)"
                [id]="'column-' + column.id"
                [cdkDropListConnectedTo]="getConnectedLists()"
                (cdkDropListDropped)="drop($event, column.id)"
              >
                @for (row of getColumnRows(column.id); track row.id) {
                  <div class="board-card" cdkDrag>
                    <div class="card-icon">{{ row.icon || '📄' }}</div>
                    <div class="card-title">{{ row.title }}</div>
                    <button class="card-open" (click)="rowClick.emit(row)">
                      <mat-icon>open_in_new</mat-icon>
                    </button>
                  </div>
                }
              </div>
              <button class="add-card-button" (click)="addRowInColumn.emit(column.id)">
                <mat-icon>add</mat-icon>
                <span>New</span>
              </button>
            </div>
          }
          <!-- Uncategorized column -->
          <div class="board-column">
            <div class="column-header">
              <span class="column-tag uncategorized">No status</span>
              <span class="column-count">{{ getUncategorizedRows().length }}</span>
            </div>
            <div
              class="column-content"
              cdkDropList
              [cdkDropListData]="getUncategorizedRows()"
              id="column-uncategorized"
              [cdkDropListConnectedTo]="getConnectedLists()"
              (cdkDropListDropped)="drop($event, null)"
            >
              @for (row of getUncategorizedRows(); track row.id) {
                <div class="board-card" cdkDrag>
                  <div class="card-icon">{{ row.icon || '📄' }}</div>
                  <div class="card-title">{{ row.title }}</div>
                  <button class="card-open" (click)="rowClick.emit(row)">
                    <mat-icon>open_in_new</mat-icon>
                  </button>
                </div>
              }
            </div>
            <button class="add-card-button" (click)="addRowInColumn.emit(null)">
              <mat-icon>add</mat-icon>
              <span>New</span>
            </button>
          </div>
        </div>
      } @else {
        <div class="no-group-property">
          <p>Select a Select property to group by</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .board-container {
      height: 100%;
      overflow-x: auto;
      padding: 16px;
    }

    .board-columns {
      display: flex;
      gap: 16px;
      min-height: 100%;
    }

    .board-column {
      width: 280px;
      min-width: 280px;
      background: #f7f6f3;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 200px);
    }

    .column-header {
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .column-tag {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: white;
    }

    .column-tag.uncategorized {
      background: #999;
    }

    .column-count {
      color: #999;
      font-size: 12px;
    }

    .column-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 8px;
      min-height: 100px;
    }

    .board-card {
      background: white;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      cursor: grab;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .board-card:active {
      cursor: grabbing;
    }

    .cdk-drag-preview {
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .card-icon {
      font-size: 16px;
    }

    .card-title {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }

    .card-open {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #999;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .board-card:hover .card-open {
      opacity: 1;
    }

    .card-open:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #333;
    }

    .card-open mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .add-card-button {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      margin: 8px;
      border-radius: 4px;
      color: #666;
      font-size: 14px;
    }

    .add-card-button:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .no-group-property {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
    }
  `],
})
export class BoardViewComponent {
  @Input() properties: DatabaseProperty[] = [];
  @Input() rows: DatabaseRow[] = [];
  @Input() groupByPropertyId: string | null = null;

  @Output() rowClick = new EventEmitter<DatabaseRow>();
  @Output() addRowInColumn = new EventEmitter<string | null>();
  @Output() moveRow = new EventEmitter<{ rowId: string; newValue: string | null }>();

  get groupByProperty(): DatabaseProperty | undefined {
    return this.properties.find(
      (p) => p.id === this.groupByPropertyId && p.type === PropertyType.SELECT
    );
  }

  getColumns(): SelectOption[] {
    return this.groupByProperty?.config.options || [];
  }

  getColumnRows(columnId: string): DatabaseRow[] {
    if (!this.groupByPropertyId) return [];
    return this.rows.filter((row) => row.properties[this.groupByPropertyId!] === columnId);
  }

  getUncategorizedRows(): DatabaseRow[] {
    if (!this.groupByPropertyId) return this.rows;
    const columnIds = new Set(this.getColumns().map((c) => c.id));
    return this.rows.filter((row) => {
      const value = row.properties[this.groupByPropertyId!];
      return !value || !columnIds.has(String(value));
    });
  }

  getConnectedLists(): string[] {
    const lists = this.getColumns().map((c) => 'column-' + c.id);
    lists.push('column-uncategorized');
    return lists;
  }

  drop(event: CdkDragDrop<DatabaseRow[]>, columnId: string | null): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const row = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.moveRow.emit({ rowId: row.id, newValue: columnId });
    }
  }
}
