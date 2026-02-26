import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PagesState, pagesAdapter } from './pages.reducer';

export const selectPagesState = createFeatureSelector<PagesState>('pages');

const { selectAll, selectEntities } = pagesAdapter.getSelectors();

export const selectAllPages = createSelector(
  selectPagesState,
  selectAll
);

export const selectPageEntities = createSelector(
  selectPagesState,
  selectEntities
);

export const selectPageTree = createSelector(
  selectPagesState,
  (state) => state.tree
);

export const selectSelectedPageId = createSelector(
  selectPagesState,
  (state) => state.selectedPageId
);

export const selectSelectedPage = createSelector(
  selectPageEntities,
  selectSelectedPageId,
  (entities, selectedId) => (selectedId ? entities[selectedId] : null)
);

export const selectPagesLoading = createSelector(
  selectPagesState,
  (state) => state.loading
);

export const selectPagesError = createSelector(
  selectPagesState,
  (state) => state.error
);

export const selectTrash = createSelector(
  selectPagesState,
  (state) => state.trash
);

export const selectPageById = (id: string) =>
  createSelector(selectPageEntities, (entities) => entities[id]);

export const selectRootPages = createSelector(
  selectAllPages,
  (pages) => pages.filter((p) => !p.parentId)
);

export const selectChildPages = (parentId: string) =>
  createSelector(selectAllPages, (pages) =>
    pages.filter((p) => p.parentId === parentId)
  );
