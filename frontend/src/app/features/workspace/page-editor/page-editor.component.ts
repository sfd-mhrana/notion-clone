import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, distinctUntilChanged, filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { BlockEditorComponent } from '../../editor/block-editor/block-editor.component';
import { PagesActions, selectSelectedPage, selectPagesLoading } from '../../../store/pages';
import { BlocksActions, selectBlocksForCurrentPage } from '../../../store/blocks';
import { Block, BlockType, BlockContent } from '../../editor/editor.models';
import { InputDialogComponent } from '../../../shared/dialogs/input-dialog/input-dialog.component';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    BlockEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-editor">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Loading page...</span>
        </div>
      } @else if (page(); as p) {
        <!-- Cover Image -->
        @if (p.coverImage) {
          <div class="cover-image" [style.backgroundImage]="'url(' + p.coverImage + ')'">
            <div class="cover-actions">
              <button mat-button (click)="changeCover()">Change cover</button>
              <button mat-button (click)="removeCover()">Remove</button>
            </div>
          </div>
        }

        <!-- Page Header -->
        <div class="page-header" [class.with-cover]="p.coverImage">
          <!-- Icon -->
          <button class="page-icon" [matMenuTriggerFor]="iconMenu">
            {{ p.icon || '📄' }}
          </button>
          <mat-menu #iconMenu="matMenu" class="icon-picker">
            <div class="icon-grid" (click)="$event.stopPropagation()">
              @for (emoji of commonEmojis; track emoji) {
                <button class="emoji-btn" (click)="updateIcon(emoji)">{{ emoji }}</button>
              }
            </div>
          </mat-menu>

          <!-- Title -->
          <input
            type="text"
            class="page-title"
            [value]="p.title"
            placeholder="Untitled"
            (blur)="updateTitle($event)"
            (keydown.enter)="$event.target.blur()"
          />

          <!-- Actions -->
          <div class="page-actions">
            @if (!p.coverImage) {
              <button mat-button (click)="addCover()">
                <mat-icon>image</mat-icon> Add cover
              </button>
            }
          </div>
        </div>

        <!-- Block Editor -->
        <div class="editor-container">
          <app-block-editor
            [initialBlocks]="blocks()"
            [pageId]="p.id"
            [workspaceId]="workspaceId()"
            (blockCreate)="onBlockCreate($event)"
            (blockUpdate)="onBlockUpdate($event)"
            (blockDelete)="onBlockDelete($event)"
            (blockMove)="onBlockMove($event)"
            (blockTypeChange)="onBlockTypeChange($event)"
            (uploadRequest)="onUploadRequest($event)"
          />
        </div>
      } @else {
        <div class="empty-state">
          <mat-icon>article</mat-icon>
          <h2>No page selected</h2>
          <p>Select a page from the sidebar or create a new one</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-editor {
      min-height: 100vh;
      background: white;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      color: #999;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f0f0f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .cover-image {
      height: 280px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .cover-actions {
      position: absolute;
      bottom: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .cover-image:hover .cover-actions {
      opacity: 1;
    }

    .cover-actions button {
      background: rgba(255, 255, 255, 0.9);
    }

    .page-header {
      padding: 80px 96px 0;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header.with-cover {
      padding-top: 24px;
      margin-top: -60px;
    }

    .page-icon {
      font-size: 72px;
      line-height: 1;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      margin-bottom: 12px;
      display: block;
      border-radius: 4px;
    }

    .page-icon:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .page-title {
      width: 100%;
      border: none;
      outline: none;
      font-size: 40px;
      font-weight: 700;
      color: #1a1a1a;
      background: transparent;
      padding: 0;
      margin-bottom: 8px;
    }

    .page-title::placeholder {
      color: #ccc;
    }

    .page-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .page-actions button {
      color: rgba(55, 53, 47, 0.5);
      font-size: 14px;
    }

    .page-actions mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .editor-container {
      padding-bottom: 100px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 500;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    ::ng-deep .icon-picker {
      padding: 12px;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
    }

    .emoji-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 20px;
    }

    .emoji-btn:hover {
      background: rgba(55, 53, 47, 0.08);
    }
  `],
})
export class PageEditorComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  readonly pageId = signal<string | null>(null);
  readonly workspaceId = signal<string>('');
  readonly page = this.store.selectSignal(selectSelectedPage);
  readonly blocks = this.store.selectSignal(selectBlocksForCurrentPage);
  readonly loading = this.store.selectSignal(selectPagesLoading);

  readonly commonEmojis = ['📄', '📝', '📋', '📌', '📎', '🏠', '💼', '🎯', '💡', '⭐', '🔥', '✨', '🚀', '💻', '📊', '📈'];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const pageId = params.get('pageId');
        const workspaceId = params.get('workspaceId');

        this.pageId.set(pageId);
        this.workspaceId.set(workspaceId || '');

        if (pageId) {
          this.store.dispatch(PagesActions.loadPage({ id: pageId }));
          this.store.dispatch(PagesActions.selectPage({ id: pageId }));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateTitle(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pageId = this.pageId();
    if (pageId && input.value !== this.page()?.title) {
      this.store.dispatch(PagesActions.updatePage({
        id: pageId,
        data: { title: input.value || 'Untitled' },
      }));
    }
  }

  updateIcon(icon: string): void {
    const pageId = this.pageId();
    if (pageId) {
      this.store.dispatch(PagesActions.updatePage({
        id: pageId,
        data: { icon },
      }));
    }
  }

  addCover(): void {
    const dialogRef = this.dialog.open(InputDialogComponent, {
      width: '450px',
      data: {
        title: 'Add Cover Image',
        label: 'Image URL',
        placeholder: 'https://images.unsplash.com/...',
        submitLabel: 'Add Cover',
      },
    });

    dialogRef.afterClosed().subscribe((url) => {
      if (url) {
        const pageId = this.pageId();
        if (pageId) {
          this.store.dispatch(PagesActions.updatePage({
            id: pageId,
            data: { coverImage: url },
          }));
        }
      }
    });
  }

  changeCover(): void {
    this.addCover();
  }

  removeCover(): void {
    const pageId = this.pageId();
    if (pageId) {
      this.store.dispatch(PagesActions.updatePage({
        id: pageId,
        data: { coverImage: null },
      }));
    }
  }

  onBlockCreate(event: { block: Partial<Block>; afterIndex: number }): void {
    const pageId = this.pageId();
    if (pageId) {
      this.store.dispatch(BlocksActions.createBlock({
        pageId,
        data: {
          type: event.block.type || BlockType.PARAGRAPH,
          content: event.block.content || { rich_text: [] },
          order: event.afterIndex + 1,
        },
      }));
    }
  }

  onBlockUpdate(event: { blockId: string; content: BlockContent }): void {
    const blocks = this.blocks();
    const block = blocks.find(b => b.id === event.blockId);
    if (block) {
      this.store.dispatch(BlocksActions.updateBlockOptimistic({
        id: event.blockId,
        content: event.content,
        previousContent: block.content,
      }));
    }
  }

  onBlockDelete(blockId: string): void {
    this.store.dispatch(BlocksActions.deleteBlock({ id: blockId }));
  }

  onBlockMove(event: { blockId: string; newOrder: number }): void {
    this.store.dispatch(BlocksActions.moveBlock({
      id: event.blockId,
      data: { order: event.newOrder },
    }));
  }

  onBlockTypeChange(event: { blockId: string; newType: BlockType }): void {
    this.store.dispatch(BlocksActions.updateBlock({
      id: event.blockId,
      data: { type: event.newType },
    }));
  }

  onUploadRequest(event: { blockId: string; file: File }): void {
    // TODO: Implement file upload via FilesService
    console.log('Upload requested:', event);
  }
}
