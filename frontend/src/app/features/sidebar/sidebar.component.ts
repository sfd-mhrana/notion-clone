import { Component, ChangeDetectionStrategy, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  WorkspacesActions,
  selectAllWorkspaces,
  selectSelectedWorkspace,
  selectWorkspacesLoading,
} from '../../store/workspaces';
import {
  PagesActions,
  selectPageTree,
  selectSelectedPageId,
} from '../../store/pages';
import { selectUser, AuthActions } from '../../store/auth';
import { PageTreeNodeComponent } from './page-tree-node/page-tree-node.component';
import { SearchService } from '../search/search.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    PageTreeNodeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar">
      <!-- Workspace Switcher -->
      <div class="workspace-header">
        <button class="workspace-button" [matMenuTriggerFor]="workspaceMenu">
          @if (selectedWorkspace(); as ws) {
            <span class="workspace-icon">{{ ws.iconEmoji }}</span>
            <span class="workspace-name">{{ ws.name }}</span>
          } @else {
            <span class="workspace-name">Select Workspace</span>
          }
          <mat-icon class="dropdown-icon">expand_more</mat-icon>
        </button>
        <mat-menu #workspaceMenu="matMenu">
          @for (ws of workspaces(); track ws.id) {
            <button mat-menu-item (click)="selectWorkspace(ws.id)">
              <span class="workspace-icon">{{ ws.iconEmoji }}</span>
              {{ ws.name }}
            </button>
          }
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="createWorkspace()">
            <mat-icon>add</mat-icon>
            New Workspace
          </button>
        </mat-menu>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="action-button" matTooltip="Quick Find (Cmd+K)" (click)="openSearch()">
          <mat-icon>search</mat-icon>
          <span>Quick Find</span>
        </button>
      </div>

      <!-- New Page Button -->
      <div class="new-page-section">
        <button class="new-page-button" (click)="createPage()">
          <mat-icon>add</mat-icon>
          <span>New Page</span>
        </button>
      </div>

      <!-- Page Tree -->
      <div class="page-tree">
        <div class="section-header">
          <span>Pages</span>
        </div>
        @if (loading()) {
          <div class="loading-skeleton">
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
            <div class="skeleton-item"></div>
          </div>
        } @else if (pageTree().length === 0) {
          <div class="empty-state">
            <p>No pages yet</p>
            <button class="create-first-page" (click)="createPage()">
              Create your first page
            </button>
          </div>
        } @else {
          @for (page of pageTree(); track page.id) {
            <app-page-tree-node
              [page]="page"
              [selectedPageId]="selectedPageId()"
              (pageSelected)="onPageSelected($event)"
              (pageDeleted)="onPageDeleted($event)"
              (createChildPage)="onCreateChildPage($event)"
            />
          }
        }
      </div>

      <!-- Trash Link -->
      <div class="trash-section">
        <button class="action-button" routerLink="trash">
          <mat-icon>delete_outline</mat-icon>
          <span>Trash</span>
        </button>
      </div>

      <!-- User Profile -->
      <div class="user-section">
        @if (user(); as u) {
          <button class="user-button" [matMenuTriggerFor]="userMenu">
            @if (u.avatarUrl) {
              <img [src]="u.avatarUrl" [alt]="u.name" class="user-avatar" />
            } @else {
              <div class="user-avatar-placeholder">{{ u.name[0] }}</div>
            }
            <span class="user-name">{{ u.name }}</span>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item disabled>
              <mat-icon>person</mat-icon>
              {{ u.email }}
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              Logout
            </button>
          </mat-menu>
        }
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f7f6f3;
    }

    .workspace-header {
      padding: 12px;
      border-bottom: 1px solid #e5e5e5;
    }

    .workspace-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-align: left;
    }

    .workspace-button:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .workspace-icon {
      font-size: 18px;
      margin-right: 8px;
    }

    .workspace-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dropdown-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .quick-actions {
      padding: 8px 12px;
    }

    .action-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      text-align: left;
    }

    .action-button:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .action-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }

    .new-page-section {
      padding: 8px 12px;
    }

    .new-page-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
    }

    .new-page-button:hover {
      background: rgba(0, 0, 0, 0.04);
      color: #333;
    }

    .new-page-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }

    .page-tree {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
    }

    .section-header {
      padding: 4px 24px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      letter-spacing: 0.5px;
    }

    .loading-skeleton {
      padding: 0 12px;
    }

    .skeleton-item {
      height: 28px;
      margin: 4px 0;
      background: linear-gradient(90deg, #e5e5e5 25%, #f0f0f0 50%, #e5e5e5 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      padding: 16px 24px;
      text-align: center;
    }

    .empty-state p {
      margin: 0 0 12px;
      color: #999;
      font-size: 14px;
    }

    .create-first-page {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .create-first-page:hover {
      border-color: #ccc;
      background: #f9f9f9;
    }

    .trash-section {
      padding: 8px 12px;
      border-top: 1px solid #e5e5e5;
    }

    .user-section {
      padding: 12px;
      border-top: 1px solid #e5e5e5;
    }

    .user-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      text-align: left;
    }

    .user-button:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 8px;
      object-fit: cover;
    }

    .user-avatar-placeholder {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 8px;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .user-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class SidebarComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  readonly user = this.store.selectSignal(selectUser);
  readonly workspaces = this.store.selectSignal(selectAllWorkspaces);
  readonly selectedWorkspace = this.store.selectSignal(selectSelectedWorkspace);
  readonly loading = this.store.selectSignal(selectWorkspacesLoading);
  readonly pageTree = this.store.selectSignal(selectPageTree);
  readonly selectedPageId = this.store.selectSignal(selectSelectedPageId);

  ngOnInit(): void {
    this.store.dispatch(WorkspacesActions.loadWorkspaces());
    this.store.dispatch(AuthActions.loadCurrentUser());
  }

  selectWorkspace(id: string): void {
    this.store.dispatch(WorkspacesActions.selectWorkspace({ id }));
    this.store.dispatch(PagesActions.loadPageTree({ workspaceId: id }));
  }

  createWorkspace(): void {
    const name = prompt('Workspace name:');
    if (name) {
      this.store.dispatch(WorkspacesActions.createWorkspace({ data: { name } }));
    }
  }

  createPage(): void {
    const workspace = this.selectedWorkspace();
    if (workspace) {
      this.store.dispatch(PagesActions.createPage({
        workspaceId: workspace.id,
        data: { title: 'Untitled' },
      }));
    }
  }

  onPageSelected(pageId: string): void {
    const workspace = this.selectedWorkspace();
    if (workspace) {
      this.store.dispatch(PagesActions.selectPage({ id: pageId }));
      this.router.navigate(['/workspace', workspace.id, 'page', pageId]);
    }
  }

  onPageDeleted(pageId: string): void {
    this.store.dispatch(PagesActions.deletePage({ id: pageId }));
  }

  onCreateChildPage(parentId: string): void {
    const workspace = this.selectedWorkspace();
    if (workspace) {
      this.store.dispatch(PagesActions.createPage({
        workspaceId: workspace.id,
        data: { title: 'Untitled', parentId },
      }));
    }
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  openSearch(): void {
    this.searchService.openSearchModal();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }
}
