import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessToken: string | null = null; // IN MEMORY ONLY - no localStorage!

  setToken(token: string): void {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  clearToken(): void {
    this.accessToken = null;
  }

  hasToken(): boolean {
    return this.accessToken !== null;
  }
}
