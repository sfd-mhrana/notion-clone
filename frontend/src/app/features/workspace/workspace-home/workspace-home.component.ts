import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { PagesActions } from '../../../store/pages/pages.actions';
import { WorkspacesActions } from '../../../store/workspaces/workspaces.actions';
import { selectSelectedWorkspace, selectAllWorkspaces } from '../../../store/workspaces/workspaces.selectors';
import { CreateWorkspaceDialogComponent } from '../../../shared/dialogs/create-workspace-dialog/create-workspace-dialog.component';

@Component({
  selector: 'app-workspace-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-home">
      <div class="welcome-section">
        <div class="icon-container">
          <span class="material-icons">{{ workspaces().length === 0 ? 'workspaces' : 'description' }}</span>
        </div>
        <h1>Welcome to Notely</h1>
        @if (workspaces().length === 0) {
          <p>Create a workspace to get started organizing your notes and documents.</p>
          <button class="create-button" (click)="createWorkspace()">
            <span class="material-icons">add</span>
            Create your first workspace
          </button>
        } @else {
          <p>Select a page from the sidebar or create a new one to get started.</p>
          <button class="create-button" (click)="createPage()">
            <span class="material-icons">add</span>
            Create your first page
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .workspace-home {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      background: #fafafa;
    }

    .welcome-section {
      text-align: center;
      max-width: 400px;
    }

    .icon-container {
      margin-bottom: 24px;
    }

    .icon-container .material-icons {
      font-size: 64px;
      color: #667eea;
      opacity: 0.8;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 32px;
      font-weight: 600;
      color: #1a1a1a;
    }

    p {
      margin: 0 0 24px;
      color: #666;
      line-height: 1.5;
    }

    .create-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .create-button:hover {
      background: #5a67d8;
    }

    .create-button .material-icons {
      font-size: 20px;
    }
  `],
})
export class WorkspaceHomeComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly selectedWorkspace = this.store.selectSignal(selectSelectedWorkspace);
  readonly workspaces = this.store.selectSignal(selectAllWorkspaces);

  createWorkspace(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.dispatch(WorkspacesActions.createWorkspace({
          data: { name: result.name, iconEmoji: result.iconEmoji },
        }));
      }
    });
  }

  createPage(): void {
    let workspace = this.selectedWorkspace();

    // Fallback: if no workspace selected but workspaces exist, select the first one
    if (!workspace) {
      const allWorkspaces = this.workspaces();
      if (allWorkspaces.length > 0) {
        workspace = allWorkspaces[0];
        this.store.dispatch(WorkspacesActions.selectWorkspace({ id: workspace.id }));
      }
    }

    if (workspace) {
      this.store.dispatch(PagesActions.createPage({
        workspaceId: workspace.id,
        data: { title: 'Untitled' },
      }));
    }
  }
}
