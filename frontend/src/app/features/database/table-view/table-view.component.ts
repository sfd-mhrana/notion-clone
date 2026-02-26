import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import {
  DatabaseProperty,
  DatabaseRow,
  PropertyType,
  SortCondition,
} from '../database.models';

@Component({
  selector: 'app-table-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDividerModule,
    ScrollingModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <!-- Header -->
      <div class="table-header">
        <div class="header-cell title-cell">
          <span>Title</span>
        </div>
        @for (prop of properties; track prop.id) {
          <div class="header-cell" [style.width.px]="getColumnWidth(prop)">
            <button class="column-header" [matMenuTriggerFor]="columnMenu">
              <mat-icon class="property-icon">{{ getPropertyIcon(prop.type) }}</mat-icon>
              <span>{{ prop.name }}</span>
              @if (getSortDirection(prop.id); as dir) {
                <mat-icon class="sort-icon">{{ dir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              }
            </button>
            <mat-menu #columnMenu="matMenu">
              <button mat-menu-item (click)="sortBy(prop.id, 'asc')">
                <mat-icon>arrow_upward</mat-icon> Sort ascending
              </button>
              <button mat-menu-item (click)="sortBy(prop.id, 'desc')">
                <mat-icon>arrow_downward</mat-icon> Sort descending
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="deleteProperty.emit(prop.id)">
                <mat-icon>delete</mat-icon> Delete property
              </button>
            </mat-menu>
          </div>
        }
        <div class="header-cell add-column">
          <button class="add-column-button" (click)="addProperty.emit()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <!-- Body with virtual scroll -->
      <cdk-virtual-scroll-viewport itemSize="36" class="table-body">
        <div
          *cdkVirtualFor="let row of sortedRows(); trackBy: trackByRowId"
          class="table-row"
          (click)="rowClick.emit(row)"
        >
          <div class="cell title-cell">
            <span class="row-icon">{{ row.icon || '📄' }}</span>
            <input
              type="text"
              [value]="row.title"
              (blur)="updateRowTitle(row.id, $event)"
              (keydown.enter)="$any($event.target).blur()"
              class="title-input"
            />
          </div>
          @for (prop of properties; track prop.id) {
            <div class="cell" [style.width.px]="getColumnWidth(prop)">
              @switch (prop.type) {
                @case ('checkbox') {
                  <mat-checkbox
                    [checked]="!!row.properties[prop.id]"
                    (change)="updateCell(row.id, prop.id, $event.checked)"
                  ></mat-checkbox>
                }
                @case ('select') {
                  <button class="select-cell" [matMenuTriggerFor]="selectMenu">
                    @if (row.properties[prop.id]; as val) {
                      <span class="select-tag" [style.background]="getOptionColor(prop, val)">
                        {{ getOptionName(prop, val) }}
                      </span>
                    } @else {
                      <span class="empty-cell">Empty</span>
                    }
                  </button>
                  <mat-menu #selectMenu="matMenu">
                    @for (option of prop.config.options || []; track option.id) {
                      <button mat-menu-item (click)="updateCell(row.id, prop.id, option.id)">
                        <span class="select-tag" [style.background]="option.color">{{ option.name }}</span>
                      </button>
                    }
                  </mat-menu>
                }
                @case ('date') {
                  <input
                    type="date"
                    [value]="row.properties[prop.id] || ''"
                    (change)="updateCell(row.id, prop.id, $any($event.target).value)"
                    class="date-input"
                  />
                }
                @case ('number') {
                  <input
                    type="number"
                    [value]="row.properties[prop.id] || ''"
                    (blur)="updateCell(row.id, prop.id, +$any($event.target).value)"
                    class="number-input"
                  />
                }
                @default {
                  <input
                    type="text"
                    [value]="row.properties[prop.id] || ''"
                    (blur)="updateCell(row.id, prop.id, $any($event.target).value)"
                    class="text-input"
                  />
                }
              }
            </div>
          }
          <div class="cell add-column"></div>
        </div>
      </cdk-virtual-scroll-viewport>

      <!-- Add row button -->
      <div class="add-row">
        <button class="add-row-button" (click)="addRow.emit()">
          <mat-icon>add</mat-icon>
          <span>New</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .table-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-size: 14px;
    }

    .table-header {
      display: flex;
      border-bottom: 1px solid #e5e5e5;
      background: #f7f6f3;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-cell {
      padding: 8px 12px;
      border-right: 1px solid #e5e5e5;
      min-width: 150px;
    }

    .title-cell {
      min-width: 250px;
      flex-shrink: 0;
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      width: 100%;
      text-align: left;
    }

    .column-header:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .property-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
    }

    .sort-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-left: auto;
    }

    .add-column {
      min-width: 40px;
      width: 40px;
    }

    .add-column-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #666;
    }

    .add-column-button:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .table-body {
      flex: 1;
      overflow: auto;
    }

    .table-row {
      display: flex;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }

    .table-row:hover {
      background: #f9f9f9;
    }

    .cell {
      padding: 6px 12px;
      border-right: 1px solid #eee;
      display: flex;
      align-items: center;
      min-width: 150px;
    }

    .row-icon {
      margin-right: 8px;
    }

    .title-input,
    .text-input,
    .number-input,
    .date-input {
      border: none;
      background: transparent;
      width: 100%;
      outline: none;
      padding: 4px;
    }

    .title-input:focus,
    .text-input:focus,
    .number-input:focus,
    .date-input:focus {
      background: white;
      border-radius: 4px;
      box-shadow: 0 0 0 2px #667eea;
    }

    .select-cell {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      text-align: left;
      width: 100%;
    }

    .select-tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: white;
    }

    .empty-cell {
      color: #ccc;
    }

    .add-row {
      padding: 8px 12px;
      border-top: 1px solid #e5e5e5;
    }

    .add-row-button {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 4px;
      color: #666;
    }

    .add-row-button:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  `],
})
export class TableViewComponent {
  @Input() properties: DatabaseProperty[] = [];
  @Input() rows: DatabaseRow[] = [];

  @Output() rowClick = new EventEmitter<DatabaseRow>();
  @Output() addRow = new EventEmitter<void>();
  @Output() addProperty = new EventEmitter<void>();
  @Output() deleteProperty = new EventEmitter<string>();
  @Output() cellChange = new EventEmitter<{ rowId: string; propertyId: string; value: unknown }>();
  @Output() titleChange = new EventEmitter<{ rowId: string; title: string }>();

  readonly sort = signal<SortCondition | null>(null);

  sortedRows(): DatabaseRow[] {
    const sortCondition = this.sort();
    if (!sortCondition) return this.rows;

    return [...this.rows].sort((a, b) => {
      const aVal = a.properties[sortCondition.propertyId];
      const bVal = b.properties[sortCondition.propertyId];

      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortCondition.direction === 'asc' ? comparison : -comparison;
    });
  }

  trackByRowId(_: number, row: DatabaseRow): string {
    return row.id;
  }

  getColumnWidth(prop: DatabaseProperty): number {
    switch (prop.type) {
      case PropertyType.CHECKBOX: return 60;
      case PropertyType.DATE: return 130;
      case PropertyType.NUMBER: return 100;
      default: return 200;
    }
  }

  getPropertyIcon(type: PropertyType): string {
    const icons: Record<PropertyType, string> = {
      [PropertyType.TEXT]: 'text_fields',
      [PropertyType.NUMBER]: 'tag',
      [PropertyType.SELECT]: 'arrow_drop_down_circle',
      [PropertyType.MULTI_SELECT]: 'checklist',
      [PropertyType.DATE]: 'event',
      [PropertyType.PERSON]: 'person',
      [PropertyType.CHECKBOX]: 'check_box',
      [PropertyType.URL]: 'link',
      [PropertyType.EMAIL]: 'email',
      [PropertyType.PHONE]: 'phone',
      [PropertyType.FORMULA]: 'functions',
      [PropertyType.RELATION]: 'link',
      [PropertyType.ROLLUP]: 'calculate',
      [PropertyType.FILES]: 'attach_file',
    };
    return icons[type] || 'text_fields';
  }

  getSortDirection(propertyId: string): 'asc' | 'desc' | null {
    const sortCondition = this.sort();
    if (sortCondition?.propertyId === propertyId) {
      return sortCondition.direction;
    }
    return null;
  }

  sortBy(propertyId: string, direction: 'asc' | 'desc'): void {
    this.sort.set({ propertyId, direction });
  }

  getOptionColor(prop: DatabaseProperty, value: unknown): string {
    const option = prop.config.options?.find((o) => o.id === value);
    return option?.color || '#999';
  }

  getOptionName(prop: DatabaseProperty, value: unknown): string {
    const option = prop.config.options?.find((o) => o.id === value);
    return option?.name || String(value);
  }

  updateCell(rowId: string, propertyId: string, value: unknown): void {
    this.cellChange.emit({ rowId, propertyId, value });
  }

  updateRowTitle(rowId: string, event: Event): void {
    const title = (event.target as HTMLInputElement).value;
    this.titleChange.emit({ rowId, title });
  }
}
