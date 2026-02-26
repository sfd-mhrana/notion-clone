import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, debounceTime, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Block } from './block.models';
import { BlocksActions } from './blocks.actions';

@Injectable()
export class BlocksEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);

  loadBlocks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.loadBlocks),
      exhaustMap(({ pageId }) =>
        this.http.get<Block[]>(`${environment.apiUrl}/pages/${pageId}/blocks`).pipe(
          map((blocks) => BlocksActions.loadBlocksSuccess({ blocks })),
          catchError((error) =>
            of(BlocksActions.loadBlocksFailure({ error: error.error?.message || 'Failed to load blocks' }))
          )
        )
      )
    )
  );

  createBlock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.createBlock),
      exhaustMap(({ pageId, data }) =>
        this.http.post<Block>(`${environment.apiUrl}/pages/${pageId}/blocks`, data).pipe(
          map((block) => BlocksActions.createBlockSuccess({ block })),
          catchError((error) =>
            of(BlocksActions.createBlockFailure({ error: error.error?.message || 'Failed to create block' }))
          )
        )
      )
    )
  );

  updateBlock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.updateBlock),
      mergeMap(({ id, data }) =>
        this.http.patch<Block>(`${environment.apiUrl}/blocks/${id}`, data).pipe(
          map((block) => BlocksActions.updateBlockSuccess({ block })),
          catchError((error) =>
            of(BlocksActions.updateBlockFailure({ error: error.error?.message || 'Failed to update block' }))
          )
        )
      )
    )
  );

  updateBlockOptimistic$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.updateBlockOptimistic),
      debounceTime(500),
      mergeMap(({ id, content, previousContent }) =>
        this.http.patch<Block>(`${environment.apiUrl}/blocks/${id}`, { content }).pipe(
          map((block) => BlocksActions.updateBlockSuccess({ block })),
          catchError(() => of(BlocksActions.updateBlockRollback({ id, previousContent })))
        )
      )
    )
  );

  deleteBlock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.deleteBlock),
      exhaustMap(({ id }) =>
        this.http.delete<void>(`${environment.apiUrl}/blocks/${id}`).pipe(
          map(() => BlocksActions.deleteBlockSuccess({ id })),
          catchError((error) =>
            of(BlocksActions.deleteBlockFailure({ error: error.error?.message || 'Failed to delete block' }))
          )
        )
      )
    )
  );

  moveBlock$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlocksActions.moveBlock),
      exhaustMap(({ id, data }) =>
        this.http.patch<Block>(`${environment.apiUrl}/blocks/${id}/move`, data).pipe(
          map((block) => BlocksActions.moveBlockSuccess({ block })),
          catchError((error) =>
            of(BlocksActions.moveBlockFailure({ error: error.error?.message || 'Failed to move block' }))
          )
        )
      )
    )
  );
}
