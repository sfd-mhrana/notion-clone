import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../database/entities/user.entity.js';

export enum NotificationType {
  MENTION = 'mention',
  COMMENT = 'comment',
  REPLY = 'reply',
  SHARE = 'share',
  INVITE = 'invite',
  PAGE_UPDATE = 'page_update',
  SYSTEM = 'system',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type!: NotificationType;

  @Column()
  title!: string;

  @Column({ nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: {
    pageId?: string;
    blockId?: string;
    commentId?: string;
    workspaceId?: string;
    actorId?: string;
    actorName?: string;
  };

  @Column({ default: false })
  read!: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ nullable: true })
  link?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
