import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { environment } from '../../../../environments/environment';

interface Comment {
  id: string;
  content: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  resolved: boolean;
  replies?: Comment[];
  createdAt: Date;
}

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="comment-thread" [class.resolved]="comment.resolved">
      <!-- Main Comment -->
      <div class="comment">
        <div class="comment-header">
          <div class="author">
            <div class="avatar" [style.backgroundImage]="comment.author?.avatarUrl ? 'url(' + comment.author?.avatarUrl + ')' : ''">
              @if (!comment.author?.avatarUrl) {
                {{ getInitials(comment.author?.name || 'U') }}
              }
            </div>
            <span class="author-name">{{ comment.author?.name || 'Unknown' }}</span>
            <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
          </div>
          <button class="more-btn" [matMenuTriggerFor]="commentMenu">
            <mat-icon>more_horiz</mat-icon>
          </button>
          <mat-menu #commentMenu="matMenu">
            @if (!comment.resolved) {
              <button mat-menu-item (click)="resolve.emit(comment.id)">
                <mat-icon>check_circle</mat-icon> Resolve
              </button>
            } @else {
              <button mat-menu-item (click)="unresolve.emit(comment.id)">
                <mat-icon>radio_button_unchecked</mat-icon> Unresolve
              </button>
            }
            <button mat-menu-item (click)="startEdit()">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button mat-menu-item (click)="deleteComment.emit(comment.id)">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </mat-menu>
        </div>

        @if (isEditing()) {
          <div class="edit-form">
            <textarea
              class="comment-input"
              [(ngModel)]="editContent"
              rows="3"
            ></textarea>
            <div class="edit-actions">
              <button mat-button (click)="cancelEdit()">Cancel</button>
              <button mat-flat-button color="primary" (click)="saveEdit()">Save</button>
            </div>
          </div>
        } @else {
          <div class="comment-content">{{ comment.content }}</div>
        }

        @if (comment.resolved) {
          <div class="resolved-badge">
            <mat-icon>check_circle</mat-icon>
            Resolved
          </div>
        }
      </div>

      <!-- Replies -->
      @if (comment.replies && comment.replies.length > 0) {
        <div class="replies">
          @for (reply of comment.replies; track reply.id) {
            <div class="reply">
              <div class="comment-header">
                <div class="author">
                  <div class="avatar small" [style.backgroundImage]="reply.author?.avatarUrl ? 'url(' + reply.author?.avatarUrl + ')' : ''">
                    @if (!reply.author?.avatarUrl) {
                      {{ getInitials(reply.author?.name || 'U') }}
                    }
                  </div>
                  <span class="author-name">{{ reply.author?.name || 'Unknown' }}</span>
                  <span class="comment-time">{{ formatTime(reply.createdAt) }}</span>
                </div>
              </div>
              <div class="comment-content">{{ reply.content }}</div>
            </div>
          }
        </div>
      }

      <!-- Reply Input -->
      @if (showReplyInput()) {
        <div class="reply-input-container">
          <textarea
            class="comment-input"
            [(ngModel)]="replyContent"
            placeholder="Write a reply..."
            rows="2"
          ></textarea>
          <div class="reply-actions">
            <button mat-button (click)="showReplyInput.set(false)">Cancel</button>
            <button mat-flat-button color="primary" (click)="submitReply()">Reply</button>
          </div>
        </div>
      } @else {
        <button class="reply-trigger" (click)="showReplyInput.set(true)">
          <mat-icon>reply</mat-icon>
          Reply
        </button>
      }
    </div>
  `,
  styles: [`
    .comment-thread {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .comment-thread.resolved {
      opacity: 0.7;
    }

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .author {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #667eea;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      background-size: cover;
      background-position: center;
    }

    .avatar.small {
      width: 24px;
      height: 24px;
      font-size: 10px;
    }

    .author-name {
      font-weight: 500;
      font-size: 14px;
    }

    .comment-time {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
    }

    .more-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.1s ease;
    }

    .comment-thread:hover .more-btn {
      opacity: 1;
    }

    .more-btn:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .more-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .comment-content {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .resolved-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 4px 8px;
      background: rgba(13, 156, 13, 0.1);
      color: #0d9c0d;
      border-radius: 4px;
      font-size: 12px;
    }

    .resolved-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .replies {
      margin-top: 12px;
      padding-left: 36px;
      border-left: 2px solid rgba(55, 53, 47, 0.09);
    }

    .reply {
      padding: 8px 0;
    }

    .reply-trigger {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 12px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(55, 53, 47, 0.6);
      font-size: 13px;
    }

    .reply-trigger:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .reply-trigger mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .reply-input-container,
    .edit-form {
      margin-top: 12px;
    }

    .comment-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
    }

    .comment-input:focus {
      border-color: #667eea;
    }

    .reply-actions,
    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `],
})
export class CommentThreadComponent {
  @Input() comment!: Comment;

  @Output() resolve = new EventEmitter<string>();
  @Output() unresolve = new EventEmitter<string>();
  @Output() edit = new EventEmitter<{ id: string; content: string }>();
  @Output() deleteComment = new EventEmitter<string>();
  @Output() reply = new EventEmitter<{ parentId: string; content: string }>();

  readonly isEditing = signal(false);
  readonly showReplyInput = signal(false);

  editContent = '';
  replyContent = '';

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString();
  }

  startEdit(): void {
    this.editContent = this.comment.content;
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.editContent = '';
  }

  saveEdit(): void {
    if (this.editContent.trim()) {
      this.edit.emit({ id: this.comment.id, content: this.editContent.trim() });
      this.isEditing.set(false);
    }
  }

  submitReply(): void {
    if (this.replyContent.trim()) {
      this.reply.emit({ parentId: this.comment.id, content: this.replyContent.trim() });
      this.replyContent = '';
      this.showReplyInput.set(false);
    }
  }
}
