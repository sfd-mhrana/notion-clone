import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="title">
      @if (data.icon) {
        <mat-icon [class]="data.confirmColor || 'warn'">{{ data.icon }}</mat-icon>
      }
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelLabel || 'Cancel' }}</button>
      <button
        mat-flat-button
        [color]="data.confirmColor || 'warn'"
        (click)="confirm()"
      >
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .title mat-icon.warn {
      color: #f44336;
    }

    .title mat-icon.primary {
      color: #667eea;
    }

    mat-dialog-content {
      min-width: 320px;
    }

    .message {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `],
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
