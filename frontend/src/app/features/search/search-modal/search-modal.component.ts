import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSelectedWorkspace } from '../../../store/workspaces';
import { environment } from '../../../../environments/environment';

interface SearchResult {
  type: 'page' | 'block';
  id: string;
  title: string;
  snippet?: string;
  pageId?: string;
  pageTitle?: string;
  workspaceId: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-modal">
      <div class="search-header">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Search pages and blocks..."
          class="search-input"
          #searchInput
        />
        <div class="shortcut-hint">
          <kbd>Esc</kbd> to close
        </div>
      </div>

      <div class="search-content">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Searching...</span>
          </div>
        } @else if (searchControl.value && results().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <p>No results found for "{{ searchControl.value }}"</p>
          </div>
        } @else if (results().length > 0) {
          <div class="results-list">
            @for (result of results(); track result.id; let i = $index) {
              <button
                class="result-item"
                [class.selected]="i === selectedIndex()"
                (click)="selectResult(result)"
                (mouseenter)="selectedIndex.set(i)"
              >
                <mat-icon class="result-icon">
                  {{ result.type === 'page' ? 'description' : 'text_snippet' }}
                </mat-icon>
                <div class="result-content">
                  <div class="result-title">{{ result.title }}</div>
                  @if (result.snippet) {
                    <div class="result-snippet">{{ result.snippet }}</div>
                  }
                  @if (result.type === 'block' && result.pageTitle) {
                    <div class="result-page">in {{ result.pageTitle }}</div>
                  }
                </div>
                <div class="result-type">{{ result.type }}</div>
              </button>
            }
          </div>
        } @else {
          <div class="recent-section">
            <div class="section-title">Recent pages</div>
            <p class="empty-hint">Start typing to search...</p>
          </div>
        }
      </div>

      <div class="search-footer">
        <div class="footer-hint">
          <kbd>&uarr;</kbd><kbd>&darr;</kbd> to navigate
          <kbd>Enter</kbd> to select
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-modal {
      display: flex;
      flex-direction: column;
      width: 600px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
    }

    .search-header {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e5e5e5;
    }

    .search-icon {
      color: #999;
      margin-right: 12px;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 18px;
      background: transparent;
    }

    .search-input::placeholder {
      color: #999;
    }

    .shortcut-hint {
      color: #999;
      font-size: 12px;
    }

    kbd {
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-family: monospace;
    }

    .search-content {
      flex: 1;
      overflow-y: auto;
      min-height: 200px;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
      gap: 12px;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .results-list {
      padding: 8px;
    }

    .result-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      gap: 12px;
    }

    .result-item:hover,
    .result-item.selected {
      background: #f5f5f5;
    }

    .result-icon {
      color: #666;
      flex-shrink: 0;
    }

    .result-content {
      flex: 1;
      min-width: 0;
    }

    .result-title {
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-snippet {
      font-size: 13px;
      color: #666;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-page {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    .result-type {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .recent-section {
      padding: 16px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 8px;
    }

    .empty-hint {
      color: #999;
      font-size: 14px;
    }

    .search-footer {
      padding: 12px 16px;
      border-top: 1px solid #e5e5e5;
      background: #fafafa;
    }

    .footer-hint {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #999;
    }

    .footer-hint kbd {
      margin-right: 4px;
    }
  `],
})
export class SearchModalComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<SearchModalComponent>);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('');
  readonly results = signal<SearchResult[]>([]);
  readonly loading = signal(false);
  readonly selectedIndex = signal(0);

  private readonly selectedWorkspace = this.store.selectSignal(selectSelectedWorkspace);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 2) {
            this.results.set([]);
            return of(null);
          }

          const workspace = this.selectedWorkspace();
          if (!workspace) {
            return of(null);
          }

          this.loading.set(true);
          return this.http.get<SearchResponse>(
            `${environment.apiUrl}/search`,
            { params: { q: query, workspaceId: workspace.id } }
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response) {
            this.results.set(response.results);
            this.selectedIndex.set(0);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const results = this.results();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (results.length > 0) {
          this.selectResult(results[this.selectedIndex()]);
        }
        break;
      case 'Escape':
        this.dialogRef.close();
        break;
    }
  }

  selectResult(result: SearchResult): void {
    const workspace = this.selectedWorkspace();
    if (!workspace) return;

    const pageId = result.type === 'page' ? result.id : result.pageId;
    if (pageId) {
      this.router.navigate(['/workspace', workspace.id, 'page', pageId]);
    }
    this.dialogRef.close();
  }
}
