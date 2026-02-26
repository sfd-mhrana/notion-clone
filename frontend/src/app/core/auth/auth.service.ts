import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly store = inject(Store);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials, {
        withCredentials: true, // For refresh token cookie
      })
      .pipe(
        tap((response) => {
          this.tokenService.setToken(response.accessToken);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.tokenService.setToken(response.accessToken);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          this.tokenService.setToken(response.accessToken);
        })
      );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({
        complete: () => {
          this.tokenService.clearToken();
          this.router.navigate(['/login']);
        },
        error: () => {
          this.tokenService.clearToken();
          this.router.navigate(['/login']);
        },
      });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/me`);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }

  googleLogin(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}
