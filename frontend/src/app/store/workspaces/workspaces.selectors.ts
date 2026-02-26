import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WorkspacesState, workspacesAdapter } from './workspaces.reducer';

export const selectWorkspacesState = createFeatureSelector<WorkspacesState>('workspaces');

const { selectAll, selectEntities } = workspacesAdapter.getSelectors();

export const selectAllWorkspaces = createSelector(
  selectWorkspacesState,
  selectAll
);

export const selectWorkspaceEntities = createSelector(
  selectWorkspacesState,
  selectEntities
);

export const selectSelectedWorkspaceId = createSelector(
  selectWorkspacesState,
  (state) => state.selectedWorkspaceId
);

export const selectSelectedWorkspace = createSelector(
  selectWorkspaceEntities,
  selectSelectedWorkspaceId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectWorkspacesLoading = createSelector(
  selectWorkspacesState,
  (state) => state.loading
);

export const selectWorkspacesError = createSelector(
  selectWorkspacesState,
  (state) => state.error
);

export const selectWorkspaceById = (id: string) =>
  createSelector(selectWorkspaceEntities, (entities) => entities[id]);
