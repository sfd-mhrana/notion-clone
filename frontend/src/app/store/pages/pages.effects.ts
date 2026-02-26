import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Page, PageTreeNode, TrashPage } from './page.models';
import { Block } from '../blocks/block.models';
import { PagesActions } from './pages.actions';
import { BlocksActions } from '../blocks/blocks.actions';
import { Store } from '@ngrx/store';

@Injectable()
export class PagesEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);

  loadPageTree$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.loadPageTree),
      exhaustMap(({ workspaceId }) =>
        this.http.get<PageTreeNode[]>(`${environment.apiUrl}/workspaces/${workspaceId}/pages`).pipe(
          map((pages) => PagesActions.loadPageTreeSuccess({ pages })),
          catchError((error) =>
            of(PagesActions.loadPageTreeFailure({ error: error.error?.message || 'Failed to load pages' }))
          )
        )
      )
    )
  );

  loadPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.loadPage),
      exhaustMap(({ id }) =>
        this.http.get<{ page: Page; blocks: Block[] }>(`${environment.apiUrl}/pages/${id}`).pipe(
          map(({ page, blocks }) => PagesActions.loadPageSuccess({ page, blocks })),
          catchError((error) =>
            of(PagesActions.loadPageFailure({ error: error.error?.message || 'Failed to load page' }))
          )
        )
      )
    )
  );

  loadPageSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.loadPageSuccess),
      map(({ blocks }) => BlocksActions.setBlocksForPage({ blocks }))
    )
  );

  createPage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.createPage),
      exhaustMap(({ workspaceId, data }) =>
        this.http.post<Page>(`${environment.apiUrl}/workspaces/${workspaceId}/pages`, data).pipe(
          map((page) => PagesActions.createPageSuccess({ page })),
          catchError((error) =>
            of(PagesActions.createPageFailure({ error: error.error?.message || 'Failed to create page' }))
          )
        )
      )
    )
  );

  updatePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.updatePage),
      exhaustMap(({ id, data }) =>
        this.http.patch<Page>(`${environment.apiUrl}/pages/${id}`, data).pipe(
          map((page) => PagesActions.updatePageSuccess({ page })),
          catchError((error) =>
            of(PagesActions.updatePageFailure({ error: error.error?.message || 'Failed to update page' }))
          )
        )
      )
    )
  );

  deletePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.deletePage),
      exhaustMap(({ id }) =>
        this.http.delete<void>(`${environment.apiUrl}/pages/${id}`).pipe(
          map(() => PagesActions.deletePageSuccess({ id })),
          catchError((error) =>
            of(PagesActions.deletePageFailure({ error: error.error?.message || 'Failed to delete page' }))
          )
        )
      )
    )
  );

  restorePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.restorePage),
      exhaustMap(({ id }) =>
        this.http.post<Page>(`${environment.apiUrl}/pages/${id}/restore`, {}).pipe(
          map((page) => PagesActions.restorePageSuccess({ page })),
          catchError((error) =>
            of(PagesActions.restorePageFailure({ error: error.error?.message || 'Failed to restore page' }))
          )
        )
      )
    )
  );

  duplicatePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.duplicatePage),
      exhaustMap(({ id }) =>
        this.http.post<Page>(`${environment.apiUrl}/pages/${id}/duplicate`, {}).pipe(
          map((page) => PagesActions.duplicatePageSuccess({ page })),
          catchError((error) =>
            of(PagesActions.duplicatePageFailure({ error: error.error?.message || 'Failed to duplicate page' }))
          )
        )
      )
    )
  );

  movePage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.movePage),
      exhaustMap(({ id, data }) =>
        this.http.patch<Page>(`${environment.apiUrl}/pages/${id}/move`, data).pipe(
          map((page) => PagesActions.movePageSuccess({ page })),
          catchError((error) =>
            of(PagesActions.movePageFailure({ error: error.error?.message || 'Failed to move page' }))
          )
        )
      )
    )
  );

  loadTrash$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PagesActions.loadTrash),
      exhaustMap(({ workspaceId }) =>
        this.http.get<TrashPage[]>(`${environment.apiUrl}/workspaces/${workspaceId}/trash`).pipe(
          map((pages) => PagesActions.loadTrashSuccess({ pages })),
          catchError((error) =>
            of(PagesActions.loadTrashFailure({ error: error.error?.message || 'Failed to load trash' }))
          )
        )
      )
    )
  );
}
