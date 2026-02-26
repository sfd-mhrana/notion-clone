import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity.js';
import { Page } from '../../../database/entities/page.entity.js';
import { Block } from '../../../database/entities/block.entity.js';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'page_id' })
  pageId!: string;

  @ManyToOne(() => Page, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'page_id' })
  page!: Page;

  @Column({ name: 'block_id', nullable: true })
  blockId?: string;

  @ManyToOne(() => Block, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'block_id' })
  block?: Block;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Comment, comment => comment.replies, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  replies!: Comment[];

  @Column({ name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ default: false })
  resolved!: boolean;

  @Column({ name: 'resolved_by_id', nullable: true })
  resolvedById?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: User;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
