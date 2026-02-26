import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Workspace } from './workspace.models';
import { WorkspacesActions } from './workspaces.actions';

export interface WorkspacesState extends EntityState<Workspace> {
  selectedWorkspaceId: string | null;
  loading: boolean;
  error: string | null;
}

export const workspacesAdapter: EntityAdapter<Workspace> = createEntityAdapter<Workspace>();

export const workspacesInitialState: WorkspacesState = workspacesAdapter.getInitialState({
  selectedWorkspaceId: null,
  loading: false,
  error: null,
});

export const workspacesReducer = createReducer(
  workspacesInitialState,

  on(WorkspacesActions.loadWorkspaces, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WorkspacesActions.loadWorkspacesSuccess, (state, { workspaces }) =>
    workspacesAdapter.setAll(workspaces, {
      ...state,
      loading: false,
    })
  ),

  on(WorkspacesActions.loadWorkspacesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(WorkspacesActions.loadWorkspace, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WorkspacesActions.loadWorkspaceSuccess, (state, { workspace }) =>
    workspacesAdapter.upsertOne(workspace, {
      ...state,
      loading: false,
    })
  ),

  on(WorkspacesActions.loadWorkspaceFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(WorkspacesActions.createWorkspace, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(WorkspacesActions.createWorkspaceSuccess, (state, { workspace }) =>
    workspacesAdapter.addOne(workspace, {
      ...state,
      loading: false,
      selectedWorkspaceId: workspace.id,
    })
  ),

  on(WorkspacesActions.createWorkspaceFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(WorkspacesActions.updateWorkspaceSuccess, (state, { workspace }) =>
    workspacesAdapter.updateOne(
      { id: workspace.id, changes: workspace },
      state
    )
  ),

  on(WorkspacesActions.deleteWorkspaceSuccess, (state, { id }) =>
    workspacesAdapter.removeOne(id, {
      ...state,
      selectedWorkspaceId: state.selectedWorkspaceId === id ? null : state.selectedWorkspaceId,
    })
  ),

  on(WorkspacesActions.selectWorkspace, (state, { id }) => ({
    ...state,
    selectedWorkspaceId: id,
  })),

  on(WorkspacesActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
