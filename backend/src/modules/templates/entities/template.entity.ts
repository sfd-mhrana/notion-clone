import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity.js';
import { Workspace } from '../../../database/entities/workspace.entity.js';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ default: 'general' })
  category!: string;

  @Column({ type: 'jsonb' })
  content!: {
    blocks: unknown[];
    properties?: unknown[];
  };

  @Column({ default: false })
  isPublic!: boolean;

  @Column({ default: 0 })
  usageCount!: number;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId?: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace?: Workspace;

  @Column({ name: 'created_by_id' })
  createdById!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
