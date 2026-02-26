import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity.js';
import { Workspace } from './workspace.entity.js';
import { Block } from './block.entity.js';
import { DatabaseProperty } from './database-property.entity.js';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', default: 'Untitled' })
  title!: string;

  @Column({ type: 'varchar', nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', nullable: true })
  coverImage!: string | null;

  @Index()
  @Column({ type: 'uuid', name: 'workspace_id' })
  workspaceId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId!: string | null;

  @Column({ type: 'boolean', default: false })
  isDatabase!: boolean;

  @Column({ type: 'boolean', default: false })
  isTemplate!: boolean;

  @Index()
  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'varchar', default: '0' })
  order!: string;

  @Column({ type: 'uuid', name: 'created_by_id' })
  createdById!: string;

  @Column({ type: 'uuid', name: 'updated_by_id' })
  updatedById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Workspace, (workspace) => workspace.pages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace!: Workspace;

  @ManyToOne(() => Page, (page) => page.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Page | null;

  @OneToMany(() => Page, (page) => page.parent)
  children!: Page[];

  @OneToMany(() => Block, (block) => block.page)
  blocks!: Block[];

  @OneToMany(() => DatabaseProperty, (prop) => prop.page)
  databaseProperties!: DatabaseProperty[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy!: User;
}
