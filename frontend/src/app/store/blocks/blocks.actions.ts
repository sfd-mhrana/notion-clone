import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Block, CreateBlockRequest, UpdateBlockRequest, MoveBlockRequest, BlockContent } from './block.models';

export const BlocksActions = createActionGroup({
  source: 'Blocks',
  events: {
    'Load Blocks': props<{ pageId: string }>(),
    'Load Blocks Success': props<{ blocks: Block[] }>(),
    'Load Blocks Failure': props<{ error: string }>(),

    'Set Blocks For Page': props<{ blocks: Block[] }>(),

    'Create Block': props<{ pageId: string; data: CreateBlockRequest }>(),
    'Create Block Success': props<{ block: Block }>(),
    'Create Block Failure': props<{ error: string }>(),

    'Update Block': props<{ id: string; data: UpdateBlockRequest }>(),
    'Update Block Success': props<{ block: Block }>(),
    'Update Block Failure': props<{ error: string }>(),

    'Update Block Optimistic': props<{ id: string; content: BlockContent; previousContent: BlockContent }>(),
    'Update Block Rollback': props<{ id: string; previousContent: BlockContent }>(),

    'Delete Block': props<{ id: string }>(),
    'Delete Block Success': props<{ id: string }>(),
    'Delete Block Failure': props<{ error: string }>(),

    'Move Block': props<{ id: string; data: MoveBlockRequest }>(),
    'Move Block Success': props<{ block: Block }>(),
    'Move Block Failure': props<{ error: string }>(),

    'Update Block From Remote': props<{ block: Block }>(),

    'Clear Blocks': emptyProps(),
    'Clear Error': emptyProps(),
  },
});
