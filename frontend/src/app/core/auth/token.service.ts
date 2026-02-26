import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface RefreshResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly http = inject(HttpClient);
  private accessToken: string | null = null;
  private initialized = false;
  private initializingPromise: Promise<boolean> | null = null;

  private readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  setToken(token: string): void {
    this.accessToken = token;
    this.isAuthenticated$.next(true);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearToken(): void {
    this.accessToken = null;
    this.isAuthenticated$.next(false);
  }

  hasToken(): boolean {
    return this.accessToken !== null;
  }

  getAuthState(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Attempt to restore session from refresh token cookie.
   * Should be called on app initialization.
   */
  async initializeAuth(): Promise<boolean> {
    if (this.initialized) {
      return this.hasToken();
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = this.tryRefreshToken().toPromise().then(result => {
      this.initialized = true;
      this.initializingPromise = null;
      return result ?? false;
    });

    return this.initializingPromise;
  }

  /**
   * Try to refresh the access token using the httpOnly refresh token cookie.
   */
  tryRefreshToken(): Observable<boolean> {
    return this.http.post<RefreshResponse>(
      `${environment.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.setToken(response.accessToken);
      }),
      map(() => true),
      catchError(() => {
        this.clearToken();
        return of(false);
      })
    );
  }
}
