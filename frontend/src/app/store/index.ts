import { ActionReducerMap } from '@ngrx/store';
import { authReducer } from './auth';
import type { AuthState } from './auth';
import { workspacesReducer } from './workspaces';
import type { WorkspacesState } from './workspaces';
import { pagesReducer } from './pages';
import type { PagesState } from './pages';
import { blocksReducer } from './blocks';
import type { BlocksState } from './blocks';

export interface AppState {
  auth: AuthState;
  workspaces: WorkspacesState;
  pages: PagesState;
  blocks: BlocksState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  workspaces: workspacesReducer,
  pages: pagesReducer,
  blocks: blocksReducer,
};

// Re-export only specific items to avoid initialState conflicts
export { AuthActions, authReducer } from './auth';
export type { AuthState } from './auth';
export * from './auth/auth.selectors';
export * from './auth/auth.effects';

export { WorkspacesActions, workspacesReducer, workspacesAdapter } from './workspaces';
export type { WorkspacesState } from './workspaces';
export * from './workspaces/workspace.models';
export * from './workspaces/workspaces.selectors';
export * from './workspaces/workspaces.effects';

export { PagesActions, pagesReducer, pagesAdapter } from './pages';
export type { PagesState } from './pages';
export * from './pages/page.models';
export * from './pages/pages.selectors';
export * from './pages/pages.effects';

export { BlocksActions, blocksReducer, blocksAdapter } from './blocks';
export type { BlocksState } from './blocks';
export * from './blocks/block.models';
export * from './blocks/blocks.selectors';
export * from './blocks/blocks.effects';
