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
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { environment } from '../../../../environments/environment';

interface Template {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  category: string;
  isPublic: boolean;
  usageCount: number;
}

@Component({
  selector: 'app-template-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="template-gallery">
      <div class="gallery-header">
        <h2>Templates</h2>
        <mat-form-field class="search-field" appearance="outline">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search templates..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </mat-form-field>
      </div>

      <mat-tab-group class="category-tabs">
        <mat-tab label="All">
          <ng-template matTabContent>
            <div class="templates-grid">
              @for (template of filteredTemplates(); track template.id) {
                <div class="template-card" (click)="selectTemplate(template)">
                  <div class="card-cover" [style.backgroundImage]="template.coverImage ? 'url(' + template.coverImage + ')' : ''">
                    @if (!template.coverImage) {
                      <span class="template-icon">{{ template.icon || '📄' }}</span>
                    }
                  </div>
                  <div class="card-content">
                    <h3 class="template-name">{{ template.name }}</h3>
                    <p class="template-description">{{ template.description || 'No description' }}</p>
                    <div class="template-meta">
                      <span class="usage-count">{{ template.usageCount }} uses</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <mat-icon>folder_open</mat-icon>
                  <p>No templates found</p>
                </div>
              }
            </div>
          </ng-template>
        </mat-tab>
        @for (cat of categories; track cat) {
          <mat-tab [label]="cat">
            <ng-template matTabContent>
              <div class="templates-grid">
                @for (template of getTemplatesByCategory(cat); track template.id) {
                  <div class="template-card" (click)="selectTemplate(template)">
                    <div class="card-cover" [style.backgroundImage]="template.coverImage ? 'url(' + template.coverImage + ')' : ''">
                      @if (!template.coverImage) {
                        <span class="template-icon">{{ template.icon || '📄' }}</span>
                      }
                    </div>
                    <div class="card-content">
                      <h3 class="template-name">{{ template.name }}</h3>
                      <p class="template-description">{{ template.description || 'No description' }}</p>
                    </div>
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>
        }
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .template-gallery {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .gallery-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .gallery-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .search-field {
      width: 300px;
    }

    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      padding: 16px 0;
    }

    .template-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.1s ease;
    }

    .template-card:hover {
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

    .template-icon {
      font-size: 48px;
    }

    .card-content {
      padding: 16px;
    }

    .template-name {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .template-description {
      margin: 0;
      font-size: 13px;
      color: rgba(55, 53, 47, 0.6);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .template-meta {
      margin-top: 12px;
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: rgba(55, 53, 47, 0.4);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `],
})
export class TemplateGalleryComponent {
  @Input() workspaceId = '';
  @Output() templateSelect = new EventEmitter<Template>();

  private readonly http = inject(HttpClient);

  readonly templates = signal<Template[]>([]);
  readonly loading = signal(false);

  searchQuery = '';
  categories = ['General', 'Project', 'Meeting', 'Documentation', 'Personal'];

  constructor() {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.http.get<Template[]>(`${environment.apiUrl}/api/templates`, {
      params: this.workspaceId ? { workspaceId: this.workspaceId } : {},
    }).subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  filteredTemplates(): Template[] {
    const query = this.searchQuery.toLowerCase();
    if (!query) return this.templates();
    return this.templates().filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    );
  }

  getTemplatesByCategory(category: string): Template[] {
    return this.templates().filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  onSearch(): void {
    // Filtering is handled by filteredTemplates()
  }

  selectTemplate(template: Template): void {
    this.templateSelect.emit(template);
  }
}
