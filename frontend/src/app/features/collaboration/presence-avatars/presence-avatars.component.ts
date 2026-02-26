import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaborationService, OnlineUser } from '../collaboration.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-presence-avatars',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="presence-avatars">
      @for (user of onlineUsers(); track user.userId) {
        <div
          class="avatar"
          [style.background-color]="user.color"
          [matTooltip]="user.userName"
        >
          {{ user.userName[0]?.toUpperCase() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .presence-avatars {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid white;
      margin-left: -8px;
      cursor: default;
      animation: fadeIn 0.2s ease-out;
    }

    .avatar:last-child {
      margin-left: 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
})
export class PresenceAvatarsComponent {
  private readonly collaborationService = inject(CollaborationService);

  readonly onlineUsers = toSignal(
    this.collaborationService.onlineUsers$.pipe(
      map((users) => Array.from(users.values()))
    ),
    { initialValue: [] as OnlineUser[] }
  );
}
