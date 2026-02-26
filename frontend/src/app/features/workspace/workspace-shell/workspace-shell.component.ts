import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-workspace-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-shell">
      <aside class="sidebar">
        <app-sidebar />
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .workspace-shell {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 260px;
      background: #f7f6f3;
      border-right: 1px solid #e5e5e5;
      flex-shrink: 0;
    }

    .content {
      flex: 1;
      overflow: auto;
      background: white;
    }
  `],
})
export class WorkspaceShellComponent {}
