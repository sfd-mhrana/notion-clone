export interface Page {
  id: string;
  title: string;
  icon: string | null;
  coverImage: string | null;
  workspaceId: string;
  parentId: string | null;
  isDatabase: boolean;
  isTemplate: boolean;
  order: number;
  createdById: string;
  updatedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageTreeNode extends Page {
  children: PageTreeNode[];
}

export interface TrashPage extends Page {
  deletedAt: Date;
}

export interface CreatePageRequest {
  title?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdatePageRequest {
  title?: string;
  icon?: string;
  coverImage?: string | null;
}

export interface MovePageRequest {
  parentId?: string | null;
  workspaceId?: string;
  order?: number;
}
