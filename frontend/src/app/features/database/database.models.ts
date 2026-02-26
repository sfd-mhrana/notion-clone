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

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface DatabaseProperty {
  id: string;
  pageId: string;
  name: string;
  type: PropertyType;
  config: {
    options?: SelectOption[];
    [key: string]: unknown;
  };
  order: number;
}

export interface DatabaseRow {
  id: string;
  title: string;
  icon: string | null;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Database {
  id: string;
  title: string;
  properties: DatabaseProperty[];
  rows: DatabaseRow[];
}

export type ViewType = 'table' | 'board' | 'calendar' | 'gallery';

export interface FilterCondition {
  propertyId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: unknown;
}

export interface SortCondition {
  propertyId: string;
  direction: 'asc' | 'desc';
}
