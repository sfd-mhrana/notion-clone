import { Routes } from '@angular/router';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./workspace-shell/workspace-shell.component').then(m => m.WorkspaceShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./workspace-home/workspace-home.component').then(m => m.WorkspaceHomeComponent),
      },
      {
        path: ':workspaceId/page/:pageId',
        loadComponent: () => import('./page-editor/page-editor.component').then(m => m.PageEditorComponent),
      },
    ],
  },
];
