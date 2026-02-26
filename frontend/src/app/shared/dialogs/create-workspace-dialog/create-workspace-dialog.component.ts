import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-workspace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Create Workspace</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Workspace name</mat-label>
        <input
          matInput
          [(ngModel)]="workspaceName"
          placeholder="My Workspace"
          (keyup.enter)="submit()"
          cdkFocusInitial
        />
      </mat-form-field>
      <div class="icon-section">
        <label class="icon-label">Icon</label>
        <div class="emoji-picker">
          @for (emoji of emojiOptions; track emoji) {
            <button
              type="button"
              class="emoji-option"
              [class.selected]="iconEmoji === emoji"
              (click)="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          }
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!workspaceName.trim()"
        (click)="submit()"
      >
        Create
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-content {
      overflow: visible;
    }

    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 360px;
      padding-top: 20px;
      overflow: visible;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      overflow: visible;
    }

    .icon-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .icon-label {
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }

    .emoji-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .emoji-option {
      width: 40px;
      height: 40px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .emoji-option:hover {
      border-color: #bdbdbd;
      background: #f5f5f5;
      transform: scale(1.05);
    }

    .emoji-option.selected {
      border-color: #667eea;
      background: #eef0ff;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `],
})
export class CreateWorkspaceDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateWorkspaceDialogComponent>);

  workspaceName = '';
  iconEmoji = '🏠';

  emojiOptions = ['🏠', '💼', '📚', '🎯', '🚀', '💡', '🎨', '📝', '⭐', '🔥', '💎', '🌟'];

  selectEmoji(emoji: string): void {
    this.iconEmoji = emoji;
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.workspaceName.trim()) {
      this.dialogRef.close({
        name: this.workspaceName.trim(),
        iconEmoji: this.iconEmoji || '🏠',
      });
    }
  }
}
