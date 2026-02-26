export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  iconEmoji: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  currentUserRole: WorkspaceRole;
}

export interface WorkspaceDetail extends Workspace {
  members: WorkspaceMember[];
}

export interface CreateWorkspaceRequest {
  name: string;
  iconEmoji?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  iconEmoji?: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: WorkspaceRole;
}
