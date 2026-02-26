import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'workspace',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [publicGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./features/auth/callback/oauth-callback.component').then(m => m.OAuthCallbackComponent),
  },
  {
    path: 'workspace',
    loadChildren: () => import('./features/workspace/workspace.routes').then(m => m.WORKSPACE_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'workspace',
  },
];
