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
import { Page } from './page.entity.js';

export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  BULLETED_LIST_ITEM = 'bulleted_list_item',
  NUMBERED_LIST_ITEM = 'numbered_list_item',
  TO_DO = 'to_do',
  TOGGLE = 'toggle',
  CODE = 'code',
  QUOTE = 'quote',
  CALLOUT = 'callout',
  DIVIDER = 'divider',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  EMBED = 'embed',
  BOOKMARK = 'bookmark',
  COLUMN_LIST = 'column_list',
  COLUMN = 'column',
  CHILD_PAGE = 'child_page',
  CHILD_DATABASE = 'child_database',
  TABLE_OF_CONTENTS = 'table_of_contents',
  EQUATION = 'equation',
}

@Entity('blocks')
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: BlockType,
    default: BlockType.PARAGRAPH,
  })
  type!: BlockType;

  @Index()
  @Column({ type: 'uuid', name: 'page_id' })
  pageId!: string;

  @Index()
  @Column({ type: 'uuid', name: 'parent_block_id', nullable: true })
  parentBlockId!: string | null;

  @Column({ type: 'jsonb', default: {} })
  content!: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'uuid', name: 'created_by_id' })
  createdById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Page, (page) => page.blocks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'page_id' })
  page!: Page;

  @ManyToOne(() => Block, (block) => block.children, { nullable: true })
  @JoinColumn({ name: 'parent_block_id' })
  parentBlock!: Block | null;

  @OneToMany(() => Block, (block) => block.parentBlock)
  children!: Block[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;
}
