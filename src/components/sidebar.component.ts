import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService, Page } from '../services/supabase.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Workspace</h2>
        <button class="new-page-btn" (click)="createNewPage()">+ New Page</button>
      </div>
      <div class="pages-list">
        <div
          *ngFor="let page of pages"
          class="page-item"
          [class.active]="page.id === selectedPageId"
          (click)="selectPage(page.id)"
        >
          <span class="page-icon">{{ page.icon || '📄' }}</span>
          <span class="page-title">{{ page.title }}</span>
        </div>
        <div *ngIf="pages.length === 0" class="empty-state">
          No pages yet. Click "New Page" to get started.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #f7f6f3;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 20px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .sidebar-header h2 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #37352f;
    }

    .new-page-btn {
      width: 100%;
      padding: 6px 12px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 14px;
      color: #37352f;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .new-page-btn:hover {
      background: #f7f6f3;
    }

    .pages-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px;
    }

    .page-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      margin: 2px 0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: #37352f;
      transition: background 0.15s ease;
    }

    .page-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .page-item.active {
      background: rgba(0, 0, 0, 0.08);
    }

    .page-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .page-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-state {
      padding: 20px;
      text-align: center;
      color: #9b9a97;
      font-size: 13px;
      line-height: 1.5;
    }
  `]
})
export class SidebarComponent implements OnInit {
  pages: Page[] = [];
  selectedPageId: string | null = null;

  @Output() pageSelected = new EventEmitter<string>();

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadPages();
  }

  async loadPages() {
    try {
      this.pages = await this.supabaseService.getPages();
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  }

  async createNewPage() {
    try {
      const newPage = await this.supabaseService.createPage({
        title: 'Untitled',
        position: this.pages.length
      });
      this.pages.push(newPage);
      this.selectPage(newPage.id);
    } catch (error) {
      console.error('Error creating page:', error);
    }
  }

  selectPage(pageId: string) {
    this.selectedPageId = pageId;
    this.pageSelected.emit(pageId);
  }
}
