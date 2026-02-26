import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Page, PageTreeNode, TrashPage } from './page.models';
import { PagesActions } from './pages.actions';

export interface PagesState extends EntityState<Page> {
  selectedPageId: string | null;
  tree: PageTreeNode[];
  trash: TrashPage[];
  loading: boolean;
  error: string | null;
}

export const pagesAdapter: EntityAdapter<Page> = createEntityAdapter<Page>();

export const pagesInitialState: PagesState = pagesAdapter.getInitialState({
  selectedPageId: null,
  tree: [],
  trash: [],
  loading: false,
  error: null,
});

export const pagesReducer = createReducer(
  pagesInitialState,

  on(PagesActions.loadPageTree, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PagesActions.loadPageTreeSuccess, (state, { pages }) => {
    const flatPages = flattenTree(pages);
    return pagesAdapter.setAll(flatPages, {
      ...state,
      tree: pages,
      loading: false,
    });
  }),

  on(PagesActions.loadPageTreeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(PagesActions.loadPage, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PagesActions.loadPageSuccess, (state, { page }) =>
    pagesAdapter.upsertOne(page, {
      ...state,
      loading: false,
    })
  ),

  on(PagesActions.loadPageFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(PagesActions.createPage, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(PagesActions.createPageSuccess, (state, { page }) =>
    pagesAdapter.addOne(page, {
      ...state,
      loading: false,
      selectedPageId: page.id,
    })
  ),

  on(PagesActions.createPageFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(PagesActions.updatePageSuccess, (state, { page }) =>
    pagesAdapter.updateOne({ id: page.id, changes: page }, state)
  ),

  on(PagesActions.deletePageSuccess, (state, { id }) =>
    pagesAdapter.removeOne(id, {
      ...state,
      selectedPageId: state.selectedPageId === id ? null : state.selectedPageId,
    })
  ),

  on(PagesActions.restorePageSuccess, (state, { page }) =>
    pagesAdapter.addOne(page, {
      ...state,
      trash: state.trash.filter((p: TrashPage) => p.id !== page.id),
    })
  ),

  on(PagesActions.duplicatePageSuccess, (state, { page }) =>
    pagesAdapter.addOne(page, {
      ...state,
      selectedPageId: page.id,
    })
  ),

  on(PagesActions.movePageSuccess, (state, { page }) =>
    pagesAdapter.updateOne({ id: page.id, changes: page }, state)
  ),

  on(PagesActions.loadTrashSuccess, (state, { pages }) => ({
    ...state,
    trash: pages,
  })),

  on(PagesActions.selectPage, (state, { id }) => ({
    ...state,
    selectedPageId: id,
  })),

  on(PagesActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);

function flattenTree(nodes: PageTreeNode[]): Page[] {
  const result: Page[] = [];
  for (const node of nodes) {
    const { children, ...page } = node;
    result.push(page);
    if (children?.length) {
      result.push(...flattenTree(children));
    }
  }
  return result;
}
