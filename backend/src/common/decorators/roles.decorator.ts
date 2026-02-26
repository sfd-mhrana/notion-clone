import { SetMetadata } from '@nestjs/common';

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: WorkspaceRole[]) =>
  SetMetadata(ROLES_KEY, roles);
