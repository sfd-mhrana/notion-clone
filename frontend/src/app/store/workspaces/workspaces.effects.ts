import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Workspace, WorkspaceDetail, WorkspaceMember } from './workspace.models';
import { WorkspacesActions } from './workspaces.actions';

@Injectable()
export class WorkspacesEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);

  loadWorkspaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.loadWorkspaces),
      exhaustMap(() =>
        this.http.get<Workspace[]>(`${environment.apiUrl}/workspaces`).pipe(
          map((workspaces) => WorkspacesActions.loadWorkspacesSuccess({ workspaces })),
          catchError((error) =>
            of(WorkspacesActions.loadWorkspacesFailure({ error: error.error?.message || 'Failed to load workspaces' }))
          )
        )
      )
    )
  );

  loadWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.loadWorkspace),
      exhaustMap(({ id }) =>
        this.http.get<WorkspaceDetail>(`${environment.apiUrl}/workspaces/${id}`).pipe(
          map((workspace) => WorkspacesActions.loadWorkspaceSuccess({ workspace })),
          catchError((error) =>
            of(WorkspacesActions.loadWorkspaceFailure({ error: error.error?.message || 'Failed to load workspace' }))
          )
        )
      )
    )
  );

  createWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.createWorkspace),
      exhaustMap(({ data }) =>
        this.http.post<Workspace>(`${environment.apiUrl}/workspaces`, data).pipe(
          map((workspace) => WorkspacesActions.createWorkspaceSuccess({ workspace })),
          catchError((error) =>
            of(WorkspacesActions.createWorkspaceFailure({ error: error.error?.message || 'Failed to create workspace' }))
          )
        )
      )
    )
  );

  updateWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.updateWorkspace),
      exhaustMap(({ id, data }) =>
        this.http.patch<Workspace>(`${environment.apiUrl}/workspaces/${id}`, data).pipe(
          map((workspace) => WorkspacesActions.updateWorkspaceSuccess({ workspace })),
          catchError((error) =>
            of(WorkspacesActions.updateWorkspaceFailure({ error: error.error?.message || 'Failed to update workspace' }))
          )
        )
      )
    )
  );

  deleteWorkspace$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.deleteWorkspace),
      exhaustMap(({ id }) =>
        this.http.delete<void>(`${environment.apiUrl}/workspaces/${id}`).pipe(
          map(() => WorkspacesActions.deleteWorkspaceSuccess({ id })),
          catchError((error) =>
            of(WorkspacesActions.deleteWorkspaceFailure({ error: error.error?.message || 'Failed to delete workspace' }))
          )
        )
      )
    )
  );

  inviteMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.inviteMember),
      exhaustMap(({ workspaceId, data }) =>
        this.http.post<WorkspaceMember>(`${environment.apiUrl}/workspaces/${workspaceId}/invite`, data).pipe(
          map((member) => WorkspacesActions.inviteMemberSuccess({ workspaceId, member })),
          catchError((error) =>
            of(WorkspacesActions.inviteMemberFailure({ error: error.error?.message || 'Failed to invite member' }))
          )
        )
      )
    )
  );

  updateMemberRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.updateMemberRole),
      exhaustMap(({ workspaceId, userId, role }) =>
        this.http.patch<WorkspaceMember>(`${environment.apiUrl}/workspaces/${workspaceId}/members/${userId}`, { role }).pipe(
          map((member) => WorkspacesActions.updateMemberRoleSuccess({ workspaceId, member })),
          catchError((error) =>
            of(WorkspacesActions.updateMemberRoleFailure({ error: error.error?.message || 'Failed to update member role' }))
          )
        )
      )
    )
  );

  removeMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspacesActions.removeMember),
      exhaustMap(({ workspaceId, userId }) =>
        this.http.delete<void>(`${environment.apiUrl}/workspaces/${workspaceId}/members/${userId}`).pipe(
          map(() => WorkspacesActions.removeMemberSuccess({ workspaceId, userId })),
          catchError((error) =>
            of(WorkspacesActions.removeMemberFailure({ error: error.error?.message || 'Failed to remove member' }))
          )
        )
      )
    )
  );
}
