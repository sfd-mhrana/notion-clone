// Re-export from editor models for consistency
export type { Block, BlockContent, RichText, TextAnnotations } from '../../features/editor/editor.models';
export { BlockType } from '../../features/editor/editor.models';

// Import types for use in this file
import type { Block, BlockContent } from '../../features/editor/editor.models';
import { BlockType } from '../../features/editor/editor.models';

export interface CreateBlockRequest {
  type: BlockType;
  parentBlockId?: string;
  content?: BlockContent;
  order?: number;
}

export interface UpdateBlockRequest {
  type?: BlockType;
  content?: BlockContent;
}

export interface MoveBlockRequest {
  parentBlockId?: string | null;
  pageId?: string;
  order?: number;
}

export interface PendingOperation {
  id: string;
  blockId: string;
  type: 'update' | 'create' | 'delete' | 'move';
  previousState?: Block;
  timestamp: number;
}
