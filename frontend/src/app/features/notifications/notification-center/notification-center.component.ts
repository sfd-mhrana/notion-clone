import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, string>;
  read: boolean;
  link?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notification-center">
      <button
        class="notification-trigger"
        [matMenuTriggerFor]="notificationMenu"
        [matBadge]="unreadCount()"
        [matBadgeHidden]="unreadCount() === 0"
        matBadgeColor="warn"
        matBadgeSize="small"
      >
        <mat-icon>notifications</mat-icon>
      </button>

      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="menu-header">
          <span class="menu-title">Notifications</span>
          @if (unreadCount() > 0) {
            <button mat-button (click)="markAllAsRead($event)">Mark all read</button>
          }
        </div>

        <div class="notification-list">
          @for (notification of notifications(); track notification.id) {
            <div
              class="notification-item"
              [class.unread]="!notification.read"
              (click)="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <mat-icon>{{ getNotificationIcon(notification.type) }}</mat-icon>
              </div>
              <div class="notification-content">
                <span class="notification-title">{{ notification.title }}</span>
                @if (notification.message) {
                  <span class="notification-message">{{ notification.message }}</span>
                }
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              @if (!notification.read) {
                <div class="unread-indicator"></div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>notifications_none</mat-icon>
              <span>No notifications</span>
            </div>
          }
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    .notification-center {
      display: inline-flex;
    }

    .notification-trigger {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(55, 53, 47, 0.7);
    }

    .notification-trigger:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    ::ng-deep .notification-menu {
      min-width: 360px;
      max-width: 400px;
    }

    .menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(55, 53, 47, 0.09);
    }

    .menu-title {
      font-weight: 600;
      font-size: 14px;
    }

    .notification-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.1s ease;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(55, 53, 47, 0.04);
    }

    .notification-item.unread {
      background: rgba(35, 131, 226, 0.04);
    }

    .notification-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(55, 53, 47, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(55, 53, 47, 0.6);
    }

    .notification-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .notification-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.9);
    }

    .notification-message {
      font-size: 13px;
      color: rgba(55, 53, 47, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notification-time {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.4);
    }

    .unread-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2383e2;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: rgba(55, 53, 47, 0.4);
    }

    .empty-state mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
    }

    .empty-state span {
      font-size: 14px;
    }
  `],
})
export class NotificationCenterComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal(0);

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.http.get<Notification[]>(`${environment.apiUrl}/api/notifications?limit=20`)
      .subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
        },
      });
  }

  loadUnreadCount(): void {
    this.http.get<{ count: number }>(`${environment.apiUrl}/api/notifications/unread-count`)
      .subscribe({
        next: (result) => {
          this.unreadCount.set(result.count);
        },
      });
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.http.post(`${environment.apiUrl}/api/notifications/read-all`, {})
      .subscribe({
        next: () => {
          this.notifications.update(notifications =>
            notifications.map(n => ({ ...n, read: true }))
          );
          this.unreadCount.set(0);
        },
      });
  }

  handleNotificationClick(notification: Notification): void {
    if (!notification.read) {
      this.http.post(`${environment.apiUrl}/api/notifications/${notification.id}/read`, {})
        .subscribe({
          next: () => {
            this.notifications.update(notifications =>
              notifications.map(n => n.id === notification.id ? { ...n, read: true } : n)
            );
            this.unreadCount.update(c => Math.max(0, c - 1));
          },
        });
    }

    if (notification.link) {
      // Navigate to the link - in a real app, use Router
      window.location.href = notification.link;
    }
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      mention: 'alternate_email',
      comment: 'comment',
      reply: 'reply',
      share: 'share',
      invite: 'group_add',
      page_update: 'update',
      system: 'info',
    };
    return icons[type] || 'notifications';
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
}
