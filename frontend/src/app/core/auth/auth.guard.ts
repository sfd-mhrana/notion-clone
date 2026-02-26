import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasToken()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (!tokenService.hasToken()) {
    return true;
  }

  router.navigate(['/workspace']);
  return false;
};
