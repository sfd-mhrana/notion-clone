import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Create your account</h1>
        <p class="auth-subtitle">Start building your workspace</p>

        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input matInput type="text" formControlName="name" placeholder="Your name" />
            @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="you@example.com" />
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>Email is required</mat-error>
            }
            @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
              <mat-error>Please enter a valid email</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Password must be at least 8 characters</mat-error>
            }
          </mat-form-field>

          <div class="password-strength" [class]="getPasswordStrengthClass()">
            <div class="strength-bar"></div>
            <span class="strength-text">{{ getPasswordStrengthText() }}</span>
          </div>

          <button
            mat-raised-button
            color="primary"
            type="submit"
            class="full-width submit-button"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Create account
            }
          </button>
        </form>

        <div class="divider">
          <div class="divider-line"></div>
          <span class="divider-text">or continue with</span>
          <div class="divider-line"></div>
        </div>

        <button
          mat-stroked-button
          class="full-width google-button"
          (click)="onGoogleLogin()"
          [disabled]="loading()"
        >
          <mat-icon svgIcon="google"></mat-icon>
          Google
        </button>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/login" class="link">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 16px;
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .auth-title {
      margin: 0 0 8px;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
    }

    .auth-subtitle {
      margin: 0 0 32px;
      color: #666;
      text-align: center;
    }

    .full-width {
      width: 100%;
    }

    .submit-button {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
    }

    .error-message {
      background: #fee2e2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .password-strength {
      margin: -8px 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .strength-bar {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: #e5e5e5;
      position: relative;
      overflow: hidden;
    }

    .strength-bar::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      transition: width 0.3s, background 0.3s;
    }

    .password-strength.weak .strength-bar::after {
      width: 33%;
      background: #ef4444;
    }

    .password-strength.medium .strength-bar::after {
      width: 66%;
      background: #f59e0b;
    }

    .password-strength.strong .strength-bar::after {
      width: 100%;
      background: #22c55e;
    }

    .strength-text {
      font-size: 12px;
      color: #666;
      min-width: 60px;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 24px 0;
    }

    .divider-line {
      flex: 1;
      height: 1px;
      background: #e0e0e0;
    }

    .divider-text {
      color: #666;
      font-size: 14px;
      white-space: nowrap;
    }

    .google-button {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
    }

    .google-button mat-icon {
      margin-right: 8px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      color: #666;
    }

    .link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    mat-spinner {
      display: inline-block;
    }
  `],
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hidePassword = signal(true);

  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.router.navigate(['/workspace']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }

  onGoogleLogin(): void {
    this.authService.googleLogin();
  }

  getPasswordStrengthClass(): string {
    const password = this.form.get('password')?.value || '';
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrengthClass();
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  }
}
