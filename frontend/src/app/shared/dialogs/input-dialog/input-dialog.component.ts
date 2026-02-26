import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface InputDialogData {
  title: string;
  label: string;
  placeholder?: string;
  value?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-input-dialog',
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
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ data.label }}</mat-label>
        <input
          matInput
          [(ngModel)]="value"
          [placeholder]="data.placeholder || ''"
          (keyup.enter)="submit()"
          cdkFocusInitial
        />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">{{ data.cancelLabel || 'Cancel' }}</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!value.trim()"
        (click)="submit()"
      >
        {{ data.submitLabel || 'OK' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-content {
      overflow: visible;
    }

    mat-dialog-content {
      min-width: 320px;
      padding-top: 20px;
      overflow: visible;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      overflow: visible;
    }

    mat-dialog-actions {
      padding: 16px 24px;
    }
  `],
})
export class InputDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<InputDialogComponent>);
  readonly data: InputDialogData = inject(MAT_DIALOG_DATA);

  value = this.data.value || '';

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.value.trim()) {
      this.dialogRef.close(this.value.trim());
    }
  }
}
