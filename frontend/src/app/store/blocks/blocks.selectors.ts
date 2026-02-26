import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BlocksState, blocksAdapter } from './blocks.reducer';

export const selectBlocksState = createFeatureSelector<BlocksState>('blocks');

const { selectAll, selectEntities } = blocksAdapter.getSelectors();

export const selectAllBlocks = createSelector(
  selectBlocksState,
  selectAll
);

export const selectBlockEntities = createSelector(
  selectBlocksState,
  selectEntities
);

export const selectBlocksLoading = createSelector(
  selectBlocksState,
  (state) => state.loading
);

export const selectBlocksError = createSelector(
  selectBlocksState,
  (state) => state.error
);

export const selectLoadedPageIds = createSelector(
  selectBlocksState,
  (state) => state.loadedPageIds
);

export const selectBlockById = (id: string) =>
  createSelector(selectBlockEntities, (entities) => entities[id]);

export const selectBlocksByPageId = (pageId: string) =>
  createSelector(selectAllBlocks, (blocks) =>
    blocks.filter((b) => b.pageId === pageId).sort((a, b) => a.order - b.order)
  );

export const selectRootBlocksForPage = (pageId: string) =>
  createSelector(selectBlocksByPageId(pageId), (blocks) =>
    blocks.filter((b) => !b.parentBlockId)
  );

export const selectChildBlocks = (parentBlockId: string) =>
  createSelector(selectAllBlocks, (blocks) =>
    blocks.filter((b) => b.parentBlockId === parentBlockId).sort((a, b) => a.order - b.order)
  );

export const selectIsPageLoaded = (pageId: string) =>
  createSelector(selectLoadedPageIds, (ids) => ids.includes(pageId));

export const selectCurrentPageId = createSelector(
  selectBlocksState,
  (state) => state.currentPageId
);

export const selectBlocksForCurrentPage = createSelector(
  selectAllBlocks,
  selectCurrentPageId,
  (blocks, pageId) =>
    pageId
      ? blocks.filter((b) => b.pageId === pageId).sort((a, b) => a.order - b.order)
      : []
);
