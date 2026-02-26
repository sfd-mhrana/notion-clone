import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TokenService } from '../../../core/auth/token.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      @if (error) {
        <div class="error-card">
          <h2>Authentication Failed</h2>
          <p>{{ error }}</p>
          <button class="retry-button" (click)="goToLogin()">Go to Login</button>
        </div>
      } @else {
        <mat-spinner diameter="48"></mat-spinner>
        <p class="loading-text">Completing sign in...</p>
      }
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .loading-text {
      margin-top: 16px;
      color: white;
      font-size: 16px;
    }

    .error-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
    }

    .error-card h2 {
      margin: 0 0 16px;
      color: #dc2626;
    }

    .error-card p {
      margin: 0 0 24px;
      color: #666;
    }

    .retry-button {
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      cursor: pointer;
    }

    .retry-button:hover {
      background: #5a67d8;
    }
  `],
})
export class OAuthCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tokenService = inject(TokenService);

  error: string | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const errorParam = this.route.snapshot.queryParamMap.get('error');

    if (errorParam) {
      this.error = errorParam;
      return;
    }

    if (token) {
      this.tokenService.setToken(token);
      this.router.navigate(['/workspace']);
    } else {
      this.error = 'No authentication token received';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
