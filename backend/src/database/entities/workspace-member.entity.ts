import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity.js';
import { Workspace } from './workspace.entity.js';
import { WorkspaceRole } from '../../common/decorators/roles.decorator.js';

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id' })
  workspaceId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  role!: WorkspaceRole;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => Workspace, (workspace) => workspace.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => User, (user) => user.workspaceMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
