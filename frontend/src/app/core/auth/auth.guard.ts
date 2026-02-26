import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = async () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // If already has token, allow access
  if (tokenService.hasToken()) {
    return true;
  }

  // If not initialized, try to restore session from refresh token
  if (!tokenService.isInitialized()) {
    const hasSession = await tokenService.initializeAuth();
    if (hasSession) {
      return true;
    }
  }

  // No valid session, redirect to login
  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = async () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // If not initialized, try to restore session first
  if (!tokenService.isInitialized()) {
    await tokenService.initializeAuth();
  }

  // If user is authenticated, redirect to workspace
  if (tokenService.hasToken()) {
    router.navigate(['/workspace']);
    return false;
  }

  return true;
};
