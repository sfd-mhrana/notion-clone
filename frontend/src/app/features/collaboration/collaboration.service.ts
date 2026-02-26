import { Injectable, inject, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { TokenService } from '../../core/auth/token.service';
import { environment } from '../../../environments/environment';

export interface OnlineUser {
  userId: string;
  userName: string;
  color: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  blockId: string;
  offset: number;
}

export interface BlockUpdateEvent {
  blockId: string;
  content: Record<string, unknown>;
  version: number;
  userId: string;
}

export interface BlockCreateEvent {
  block: {
    id: string;
    type: string;
    content: Record<string, unknown>;
    order: number;
    parentBlockId?: string;
  };
  pageId: string;
  userId: string;
}

export interface BlockDeleteEvent {
  blockId: string;
  pageId: string;
  userId: string;
}

export interface BlockMoveEvent {
  blockId: string;
  newOrder: number;
  newParentId?: string;
  pageId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class CollaborationService implements OnDestroy {
  private readonly tokenService = inject(TokenService);
  private socket: Socket | null = null;
  private currentPageId: string | null = null;

  private readonly onlineUsersSubject = new BehaviorSubject<Map<string, OnlineUser>>(new Map());
  private readonly cursorsSubject = new BehaviorSubject<Map<string, CursorPosition>>(new Map());

  private readonly blockUpdatedSubject = new Subject<BlockUpdateEvent>();
  private readonly blockCreatedSubject = new Subject<BlockCreateEvent>();
  private readonly blockDeletedSubject = new Subject<BlockDeleteEvent>();
  private readonly blockMovedSubject = new Subject<BlockMoveEvent>();

  readonly onlineUsers$ = this.onlineUsersSubject.asObservable();
  readonly cursors$ = this.cursorsSubject.asObservable();
  readonly blockUpdated$ = this.blockUpdatedSubject.asObservable();
  readonly blockCreated$ = this.blockCreatedSubject.asObservable();
  readonly blockDeleted$ = this.blockDeletedSubject.asObservable();
  readonly blockMoved$ = this.blockMovedSubject.asObservable();

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.tokenService.getToken();
    if (!token) return;

    this.socket = io(`${environment.wsUrl}/collaboration`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('presence:joined', (user: OnlineUser) => {
      const users = new Map(this.onlineUsersSubject.value);
      users.set(user.userId, user);
      this.onlineUsersSubject.next(users);
    });

    this.socket.on('presence:left', ({ userId }: { userId: string }) => {
      const users = new Map(this.onlineUsersSubject.value);
      users.delete(userId);
      this.onlineUsersSubject.next(users);

      const cursors = new Map(this.cursorsSubject.value);
      cursors.delete(userId);
      this.cursorsSubject.next(cursors);
    });

    this.socket.on('cursor:moved', (cursor: CursorPosition) => {
      const cursors = new Map(this.cursorsSubject.value);
      cursors.set(cursor.userId, cursor);
      this.cursorsSubject.next(cursors);
    });

    this.socket.on('block:updated', (event: BlockUpdateEvent) => {
      this.blockUpdatedSubject.next(event);
    });

    this.socket.on('block:created', (event: BlockCreateEvent) => {
      this.blockCreatedSubject.next(event);
    });

    this.socket.on('block:deleted', (event: BlockDeleteEvent) => {
      this.blockDeletedSubject.next(event);
    });

    this.socket.on('block:moved', (event: BlockMoveEvent) => {
      this.blockMovedSubject.next(event);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.onlineUsersSubject.next(new Map());
    this.cursorsSubject.next(new Map());
  }

  joinPage(pageId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }

    if (this.currentPageId && this.currentPageId !== pageId) {
      this.leavePage(this.currentPageId);
    }

    this.currentPageId = pageId;
    this.socket?.emit('join:page', { pageId });
  }

  leavePage(pageId: string): void {
    this.socket?.emit('leave:page', { pageId });
    this.onlineUsersSubject.next(new Map());
    this.cursorsSubject.next(new Map());
  }

  emitBlockUpdate(blockId: string, content: Record<string, unknown>, version: number): void {
    this.socket?.emit('block:update', { blockId, content, version });
  }

  emitBlockCreate(block: BlockCreateEvent['block'], pageId: string): void {
    this.socket?.emit('block:create', { block, pageId });
  }

  emitBlockDelete(blockId: string, pageId: string): void {
    this.socket?.emit('block:delete', { blockId, pageId });
  }

  emitBlockMove(blockId: string, newOrder: number, newParentId: string | undefined, pageId: string): void {
    this.socket?.emit('block:move', { blockId, newOrder, newParentId, pageId });
  }

  emitCursorMove(pageId: string, blockId: string, offset: number): void {
    this.socket?.emit('cursor:move', { pageId, blockId, offset });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
