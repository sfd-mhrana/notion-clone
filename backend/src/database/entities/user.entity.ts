import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity.js';
import { Workspace } from './workspace.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  passwordHash!: string | null;

  @Column()
  name!: string;

  @Column({ nullable: true })
  avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspaceMemberships!: WorkspaceMember[];

  @OneToMany(() => Workspace, (workspace) => workspace.owner)
  ownedWorkspaces!: Workspace[];
}
