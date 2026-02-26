import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Workspace, WorkspaceDetail, CreateWorkspaceRequest, UpdateWorkspaceRequest, InviteMemberRequest, WorkspaceMember, WorkspaceRole } from './workspace.models';

export const WorkspacesActions = createActionGroup({
  source: 'Workspaces',
  events: {
    'Load Workspaces': emptyProps(),
    'Load Workspaces Success': props<{ workspaces: Workspace[] }>(),
    'Load Workspaces Failure': props<{ error: string }>(),

    'Load Workspace': props<{ id: string }>(),
    'Load Workspace Success': props<{ workspace: WorkspaceDetail }>(),
    'Load Workspace Failure': props<{ error: string }>(),

    'Create Workspace': props<{ data: CreateWorkspaceRequest }>(),
    'Create Workspace Success': props<{ workspace: Workspace }>(),
    'Create Workspace Failure': props<{ error: string }>(),

    'Update Workspace': props<{ id: string; data: UpdateWorkspaceRequest }>(),
    'Update Workspace Success': props<{ workspace: Workspace }>(),
    'Update Workspace Failure': props<{ error: string }>(),

    'Delete Workspace': props<{ id: string }>(),
    'Delete Workspace Success': props<{ id: string }>(),
    'Delete Workspace Failure': props<{ error: string }>(),

    'Invite Member': props<{ workspaceId: string; data: InviteMemberRequest }>(),
    'Invite Member Success': props<{ workspaceId: string; member: WorkspaceMember }>(),
    'Invite Member Failure': props<{ error: string }>(),

    'Update Member Role': props<{ workspaceId: string; userId: string; role: WorkspaceRole }>(),
    'Update Member Role Success': props<{ workspaceId: string; member: WorkspaceMember }>(),
    'Update Member Role Failure': props<{ error: string }>(),

    'Remove Member': props<{ workspaceId: string; userId: string }>(),
    'Remove Member Success': props<{ workspaceId: string; userId: string }>(),
    'Remove Member Failure': props<{ error: string }>(),

    'Select Workspace': props<{ id: string | null }>(),
    'Clear Error': emptyProps(),
  },
});
