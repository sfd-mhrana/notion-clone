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
import { DatabaseProperty, DatabaseRow, PropertyType } from '../database.models';

@Component({
  selector: 'app-gallery-view',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery-view">
      <div class="gallery-grid">
        @for (row of rows; track row.id) {
          <div class="gallery-card" (click)="rowClick.emit(row)">
            <!-- Cover Image -->
            <div class="card-cover" [style.backgroundImage]="getCoverImage(row)">
              @if (!getCoverImage(row)) {
                <mat-icon class="placeholder-icon">image</mat-icon>
              }
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <div class="card-header">
                <span class="card-icon">{{ row.icon || '📄' }}</span>
                <span class="card-title">{{ row.title || 'Untitled' }}</span>
              </div>

              <!-- Properties -->
              <div class="card-properties">
                @for (prop of visibleProperties; track prop.id) {
                  @if (row.properties[prop.id] !== undefined && row.properties[prop.id] !== null) {
                    <div class="property-row">
                      <span class="property-name">{{ prop.name }}</span>
                      <span class="property-value">{{ formatValue(prop, row.properties[prop.id]) }}</span>
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        }

        <!-- Add New Card -->
        <div class="gallery-card add-card" (click)="addRow.emit()">
          <mat-icon>add</mat-icon>
          <span>New</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gallery-view {
      padding: 16px;
      overflow-y: auto;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }

    .gallery-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.1s ease;
    }

    .gallery-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .card-cover {
      height: 140px;
      background-color: rgba(55, 53, 47, 0.08);
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .placeholder-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: rgba(55, 53, 47, 0.2);
    }

    .card-content {
      padding: 12px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .card-icon {
      font-size: 18px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-properties {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .property-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .property-name {
      color: rgba(55, 53, 47, 0.5);
      flex-shrink: 0;
    }

    .property-value {
      color: rgba(55, 53, 47, 0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .add-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      border: 2px dashed rgba(55, 53, 47, 0.16);
      background: transparent;
      box-shadow: none;
    }

    .add-card:hover {
      border-color: rgba(55, 53, 47, 0.3);
      background: rgba(55, 53, 47, 0.04);
      box-shadow: none;
      transform: none;
    }

    .add-card mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: rgba(55, 53, 47, 0.4);
      margin-bottom: 8px;
    }

    .add-card span {
      color: rgba(55, 53, 47, 0.5);
      font-size: 14px;
    }
  `],
})
export class GalleryViewComponent {
  @Input() properties: DatabaseProperty[] = [];
  @Input() rows: DatabaseRow[] = [];
  @Input() coverPropertyId = '';

  @Output() rowClick = new EventEmitter<DatabaseRow>();
  @Output() addRow = new EventEmitter<void>();

  get visibleProperties(): DatabaseProperty[] {
    return this.properties.slice(0, 3);
  }

  getCoverImage(row: DatabaseRow): string | null {
    if (!this.coverPropertyId) {
      // Try to find a files property with an image
      const filesProperty = this.properties.find(p => p.type === PropertyType.FILES);
      if (filesProperty && row.properties[filesProperty.id]) {
        const files = row.properties[filesProperty.id] as { url: string }[];
        if (files?.length > 0) {
          return `url(${files[0].url})`;
        }
      }
      return null;
    }

    const coverValue = row.properties[this.coverPropertyId];
    if (!coverValue) return null;

    if (typeof coverValue === 'string' && coverValue.startsWith('http')) {
      return `url(${coverValue})`;
    }

    return null;
  }

  formatValue(property: DatabaseProperty, value: unknown): string {
    if (value === null || value === undefined) return '';

    switch (property.type) {
      case PropertyType.CHECKBOX:
        return value ? '✓' : '✗';

      case PropertyType.DATE:
        if (typeof value === 'string' || typeof value === 'number') {
          return new Date(value).toLocaleDateString();
        }
        return String(value);

      case PropertyType.SELECT:
        const option = property.config.options?.find(o => o.id === value);
        return option?.name || String(value);

      case PropertyType.MULTI_SELECT:
        if (Array.isArray(value)) {
          return value.map(v => {
            const opt = property.config.options?.find(o => o.id === v);
            return opt?.name || v;
          }).join(', ');
        }
        return String(value);

      case PropertyType.NUMBER:
        return typeof value === 'number' ? value.toLocaleString() : String(value);

      default:
        return String(value);
    }
  }
}
