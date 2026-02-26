import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Block, PendingOperation } from './block.models';
import { BlocksActions } from './blocks.actions';

export interface BlocksState extends EntityState<Block> {
  loadedPageIds: string[];
  currentPageId: string | null;
  pendingOperations: PendingOperation[];
  loading: boolean;
  error: string | null;
}

export const blocksAdapter: EntityAdapter<Block> = createEntityAdapter<Block>({
  sortComparer: (a, b) => a.order - b.order,
});

export const blocksInitialState: BlocksState = blocksAdapter.getInitialState({
  loadedPageIds: [],
  currentPageId: null,
  pendingOperations: [],
  loading: false,
  error: null,
});

export const blocksReducer = createReducer(
  blocksInitialState,

  on(BlocksActions.loadBlocks, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BlocksActions.loadBlocksSuccess, (state, { blocks }) => {
    const pageId = blocks[0]?.pageId;
    const loadedPageIds = pageId && !state.loadedPageIds.includes(pageId)
      ? [...state.loadedPageIds, pageId]
      : state.loadedPageIds;

    return blocksAdapter.upsertMany(blocks, {
      ...state,
      loadedPageIds,
      loading: false,
    });
  }),

  on(BlocksActions.loadBlocksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BlocksActions.setCurrentPageId, (state, { pageId }) => ({
    ...state,
    currentPageId: pageId,
  })),

  on(BlocksActions.setBlocksForPage, (state, { blocks, pageId }) => {
    const loadedPageIds = pageId && !state.loadedPageIds.includes(pageId)
      ? [...state.loadedPageIds, pageId]
      : state.loadedPageIds;

    // Remove existing blocks for this page and add new ones
    const existingIds = Object.values(state.entities)
      .filter((b): b is Block => !!b && b.pageId === pageId)
      .map((b) => b.id);

    return blocksAdapter.setMany(
      blocks,
      blocksAdapter.removeMany(existingIds, {
        ...state,
        loadedPageIds,
        currentPageId: pageId,
      })
    );
  }),

  on(BlocksActions.createBlock, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(BlocksActions.createBlockSuccess, (state, { block }) =>
    blocksAdapter.addOne(block, {
      ...state,
      loading: false,
    })
  ),

  on(BlocksActions.createBlockFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(BlocksActions.updateBlockOptimistic, (state, { id, content }) => {
    const block = state.entities[id];
    if (!block) return state;

    return blocksAdapter.updateOne(
      { id, changes: { content } },
      state
    );
  }),

  on(BlocksActions.updateBlockSuccess, (state, { block }) =>
    blocksAdapter.updateOne({ id: block.id, changes: block }, state)
  ),

  on(BlocksActions.updateBlockRollback, (state, { id, previousContent }) =>
    blocksAdapter.updateOne(
      { id, changes: { content: previousContent } },
      state
    )
  ),

  on(BlocksActions.deleteBlockSuccess, (state, { id }) =>
    blocksAdapter.removeOne(id, state)
  ),

  on(BlocksActions.moveBlockSuccess, (state, { block }) =>
    blocksAdapter.updateOne({ id: block.id, changes: block }, state)
  ),

  on(BlocksActions.updateBlockFromRemote, (state, { block }) =>
    blocksAdapter.upsertOne(block, state)
  ),

  on(BlocksActions.clearBlocks, () => blocksInitialState),

  on(BlocksActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
