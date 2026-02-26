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
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DatabaseProperty, PropertyType } from '../database.models';

export interface FilterCondition {
  id: string;
  propertyId: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_checked'
  | 'is_not_checked';

const TEXT_OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: 'equals', label: 'Is' },
  { id: 'not_equals', label: 'Is not' },
  { id: 'contains', label: 'Contains' },
  { id: 'not_contains', label: 'Does not contain' },
  { id: 'starts_with', label: 'Starts with' },
  { id: 'ends_with', label: 'Ends with' },
  { id: 'is_empty', label: 'Is empty' },
  { id: 'is_not_empty', label: 'Is not empty' },
];

const NUMBER_OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: 'equals', label: '=' },
  { id: 'not_equals', label: '≠' },
  { id: 'greater_than', label: '>' },
  { id: 'less_than', label: '<' },
  { id: 'greater_or_equal', label: '≥' },
  { id: 'less_or_equal', label: '≤' },
  { id: 'is_empty', label: 'Is empty' },
  { id: 'is_not_empty', label: 'Is not empty' },
];

const CHECKBOX_OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: 'is_checked', label: 'Is checked' },
  { id: 'is_not_checked', label: 'Is not checked' },
];

const SELECT_OPERATORS: { id: FilterOperator; label: string }[] = [
  { id: 'equals', label: 'Is' },
  { id: 'not_equals', label: 'Is not' },
  { id: 'is_empty', label: 'Is empty' },
  { id: 'is_not_empty', label: 'Is not empty' },
];

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-bar">
      <div class="filters">
        @for (filter of filters(); track filter.id; let i = $index) {
          <div class="filter-item">
            @if (i > 0) {
              <span class="filter-connector">and</span>
            }

            <!-- Property Select -->
            <mat-select
              class="property-select"
              [value]="filter.propertyId"
              (selectionChange)="updateFilter(filter.id, 'propertyId', $event.value)"
            >
              @for (prop of properties; track prop.id) {
                <mat-option [value]="prop.id">{{ prop.name }}</mat-option>
              }
            </mat-select>

            <!-- Operator Select -->
            <mat-select
              class="operator-select"
              [value]="filter.operator"
              (selectionChange)="updateFilter(filter.id, 'operator', $event.value)"
            >
              @for (op of getOperators(filter.propertyId); track op.id) {
                <mat-option [value]="op.id">{{ op.label }}</mat-option>
              }
            </mat-select>

            <!-- Value Input -->
            @if (!isNoValueOperator(filter.operator)) {
              @if (getPropertyType(filter.propertyId) === 'select') {
                <mat-select
                  class="value-select"
                  [value]="filter.value"
                  (selectionChange)="updateFilter(filter.id, 'value', $event.value)"
                >
                  @for (opt of getPropertyOptions(filter.propertyId); track opt.id) {
                    <mat-option [value]="opt.id">{{ opt.name }}</mat-option>
                  }
                </mat-select>
              } @else if (getPropertyType(filter.propertyId) === 'number') {
                <input
                  type="number"
                  class="value-input"
                  [value]="filter.value"
                  (input)="updateFilter(filter.id, 'value', +$any($event.target).value)"
                  placeholder="Value"
                />
              } @else if (getPropertyType(filter.propertyId) === 'date') {
                <input
                  type="date"
                  class="value-input"
                  [value]="filter.value"
                  (input)="updateFilter(filter.id, 'value', $any($event.target).value)"
                />
              } @else {
                <input
                  type="text"
                  class="value-input"
                  [value]="filter.value"
                  (input)="updateFilter(filter.id, 'value', $any($event.target).value)"
                  placeholder="Value"
                />
              }
            }

            <!-- Remove Filter -->
            <button class="remove-btn" (click)="removeFilter(filter.id)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      </div>

      <button class="add-filter-btn" (click)="addFilter()">
        <mat-icon>add</mat-icon>
        Add filter
      </button>
    </div>
  `,
  styles: [`
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: rgba(55, 53, 47, 0.04);
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .filters {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-connector {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
      padding: 0 4px;
    }

    .property-select,
    .operator-select,
    .value-select {
      font-size: 13px;
    }

    ::ng-deep .property-select .mat-mdc-select-trigger,
    ::ng-deep .operator-select .mat-mdc-select-trigger,
    ::ng-deep .value-select .mat-mdc-select-trigger {
      font-size: 13px;
      padding: 4px 8px;
      background: white;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 4px;
    }

    .value-input {
      font-size: 13px;
      padding: 6px 8px;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 4px;
      outline: none;
      min-width: 120px;
    }

    .value-input:focus {
      border-color: #2383e2;
      box-shadow: 0 0 0 2px rgba(35, 131, 226, 0.2);
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
      color: rgba(55, 53, 47, 0.4);
    }

    .remove-btn:hover {
      background: rgba(55, 53, 47, 0.08);
      color: rgba(55, 53, 47, 0.8);
    }

    .remove-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .add-filter-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(55, 53, 47, 0.6);
      font-size: 13px;
      align-self: flex-start;
    }

    .add-filter-btn:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .add-filter-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class FilterBarComponent {
  @Input() properties: DatabaseProperty[] = [];

  @Output() filtersChange = new EventEmitter<FilterCondition[]>();

  readonly filters = signal<FilterCondition[]>([]);

  addFilter(): void {
    if (this.properties.length === 0) return;

    const newFilter: FilterCondition = {
      id: this.generateId(),
      propertyId: this.properties[0].id,
      operator: 'contains',
      value: '',
    };

    this.filters.update(f => [...f, newFilter]);
    this.emitChange();
  }

  removeFilter(id: string): void {
    this.filters.update(f => f.filter(filter => filter.id !== id));
    this.emitChange();
  }

  updateFilter(id: string, field: keyof FilterCondition, value: unknown): void {
    this.filters.update(filters =>
      filters.map(filter => {
        if (filter.id !== id) return filter;

        const updated = { ...filter, [field]: value };

        // Reset value when changing property or operator
        if (field === 'propertyId' || field === 'operator') {
          if (this.isNoValueOperator(updated.operator as FilterOperator)) {
            updated.value = undefined;
          } else if (field === 'propertyId') {
            updated.value = '';
          }
        }

        return updated;
      })
    );
    this.emitChange();
  }

  getOperators(propertyId: string): { id: FilterOperator; label: string }[] {
    const property = this.properties.find(p => p.id === propertyId);
    if (!property) return TEXT_OPERATORS;

    switch (property.type) {
      case PropertyType.NUMBER:
        return NUMBER_OPERATORS;
      case PropertyType.CHECKBOX:
        return CHECKBOX_OPERATORS;
      case PropertyType.SELECT:
      case PropertyType.MULTI_SELECT:
        return SELECT_OPERATORS;
      case PropertyType.DATE:
        return NUMBER_OPERATORS;
      default:
        return TEXT_OPERATORS;
    }
  }

  getPropertyType(propertyId: string): string {
    const property = this.properties.find(p => p.id === propertyId);
    return property?.type || 'text';
  }

  getPropertyOptions(propertyId: string): { id: string; name: string }[] {
    const property = this.properties.find(p => p.id === propertyId);
    return property?.config.options || [];
  }

  isNoValueOperator(operator: FilterOperator): boolean {
    return ['is_empty', 'is_not_empty', 'is_checked', 'is_not_checked'].includes(operator);
  }

  private emitChange(): void {
    this.filtersChange.emit(this.filters());
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
