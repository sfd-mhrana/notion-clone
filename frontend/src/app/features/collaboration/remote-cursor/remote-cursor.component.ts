import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursorPosition } from '../collaboration.service';

@Component({
  selector: 'app-remote-cursor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="remote-cursor" [style.--cursor-color]="cursor.color">
      <div class="cursor-caret"></div>
      <div class="cursor-label">{{ cursor.userName }}</div>
    </div>
  `,
  styles: [`
    .remote-cursor {
      position: absolute;
      pointer-events: none;
      z-index: 100;
      animation: fadeIn 0.15s ease-out;
    }

    .cursor-caret {
      width: 2px;
      height: 20px;
      background: var(--cursor-color);
      border-radius: 1px;
    }

    .cursor-label {
      position: absolute;
      top: -18px;
      left: 0;
      background: var(--cursor-color);
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      font-weight: 500;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `],
})
export class RemoteCursorComponent {
  @Input() cursor!: CursorPosition;
}
