import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Page, PageTreeNode, CreatePageRequest, UpdatePageRequest, MovePageRequest, TrashPage } from './page.models';
import { Block } from '../blocks/block.models';

export const PagesActions = createActionGroup({
  source: 'Pages',
  events: {
    'Load Page Tree': props<{ workspaceId: string }>(),
    'Load Page Tree Success': props<{ pages: PageTreeNode[] }>(),
    'Load Page Tree Failure': props<{ error: string }>(),

    'Load Page': props<{ id: string }>(),
    'Load Page Success': props<{ page: Page; blocks: Block[] }>(),
    'Load Page Failure': props<{ error: string }>(),

    'Create Page': props<{ workspaceId: string; data: CreatePageRequest }>(),
    'Create Page Success': props<{ page: Page }>(),
    'Create Page Failure': props<{ error: string }>(),

    'Update Page': props<{ id: string; data: UpdatePageRequest }>(),
    'Update Page Success': props<{ page: Page }>(),
    'Update Page Failure': props<{ error: string }>(),

    'Delete Page': props<{ id: string }>(),
    'Delete Page Success': props<{ id: string }>(),
    'Delete Page Failure': props<{ error: string }>(),

    'Restore Page': props<{ id: string }>(),
    'Restore Page Success': props<{ page: Page }>(),
    'Restore Page Failure': props<{ error: string }>(),

    'Duplicate Page': props<{ id: string }>(),
    'Duplicate Page Success': props<{ page: Page }>(),
    'Duplicate Page Failure': props<{ error: string }>(),

    'Move Page': props<{ id: string; data: MovePageRequest }>(),
    'Move Page Success': props<{ page: Page }>(),
    'Move Page Failure': props<{ error: string }>(),

    'Load Trash': props<{ workspaceId: string }>(),
    'Load Trash Success': props<{ pages: TrashPage[] }>(),
    'Load Trash Failure': props<{ error: string }>(),

    'Select Page': props<{ id: string | null }>(),
    'Clear Error': emptyProps(),
  },
});
