import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-workspace-home',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="workspace-home">
      <div class="welcome-section">
        <h1>Welcome to Notely</h1>
        <p>Select a page from the sidebar or create a new one to get started.</p>
        <button class="logout-button" (click)="onLogout()">Logout</button>
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
    }

    .welcome-section {
      text-align: center;
      max-width: 400px;
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
    }

    .logout-button {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
    }

    .logout-button:hover {
      background: #5a67d8;
    }
  `],
})
export class WorkspaceHomeComponent {
  private readonly authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout();
  }
}
