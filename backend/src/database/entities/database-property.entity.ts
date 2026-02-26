import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Page } from './page.entity.js';

export enum PropertyType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE = 'date',
  PERSON = 'person',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
  FORMULA = 'formula',
  RELATION = 'relation',
  ROLLUP = 'rollup',
  FILES = 'files',
}

@Entity('database_properties')
export class DatabaseProperty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'page_id' })
  pageId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({
    type: 'enum',
    enum: PropertyType,
    default: PropertyType.TEXT,
  })
  type!: PropertyType;

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Page, (page) => page.databaseProperties, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'page_id' })
  page!: Page;
}
