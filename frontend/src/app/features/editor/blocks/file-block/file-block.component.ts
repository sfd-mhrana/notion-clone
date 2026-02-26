import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Block } from '../../editor.models';

@Component({
  selector: 'app-file-block',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="file-block" [class.has-file]="hasFile" (click)="onBlockClick()">
      @if (hasFile) {
        <div class="file-wrapper">
          <mat-icon class="file-icon">{{ fileIcon }}</mat-icon>
          <div class="file-info">
            <span class="file-name">{{ fileName }}</span>
            <span class="file-size">{{ formattedSize }}</span>
          </div>
          <a [href]="fileUrl" target="_blank" class="download-btn" (click)="$event.stopPropagation()">
            <mat-icon>download</mat-icon>
          </a>
        </div>
      } @else {
        <div class="upload-placeholder" (click)="triggerUpload($event)">
          <mat-icon>attach_file</mat-icon>
          <span>Add a file</span>
          <span class="hint">Click to upload</span>
        </div>
        <input
          #fileInput
          type="file"
          class="file-input"
          (change)="onFileSelected($event)"
        />
      }
    </div>
  `,
  styles: [`
    .file-block {
      margin: 8px 0;
      border-radius: 4px;
    }

    .file-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(55, 53, 47, 0.04);
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .file-wrapper:hover {
      background: rgba(55, 53, 47, 0.08);
    }

    .file-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: rgba(55, 53, 47, 0.6);
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: rgba(55, 53, 47, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
    }

    .download-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 4px;
      color: rgba(55, 53, 47, 0.6);
      text-decoration: none;
    }

    .download-btn:hover {
      background: rgba(55, 53, 47, 0.08);
      color: rgba(55, 53, 47, 0.9);
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      background: rgba(55, 53, 47, 0.04);
      border: 2px dashed rgba(55, 53, 47, 0.16);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .upload-placeholder:hover {
      background: rgba(55, 53, 47, 0.08);
      border-color: rgba(55, 53, 47, 0.3);
    }

    .upload-placeholder mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: rgba(55, 53, 47, 0.4);
      margin-bottom: 8px;
    }

    .upload-placeholder span {
      color: rgba(55, 53, 47, 0.6);
      font-size: 14px;
    }

    .upload-placeholder .hint {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.4);
      margin-top: 4px;
    }

    .file-input {
      display: none;
    }
  `],
})
export class FileBlockComponent {
  @Input() block!: Block;
  @Input() focused = false;

  @Output() focus = new EventEmitter<void>();
  @Output() uploadRequest = new EventEmitter<{ blockId: string; file: File }>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  get hasFile(): boolean {
    return !!this.block.content.file?.url;
  }

  get fileUrl(): string {
    return this.block.content.file?.url || '';
  }

  get fileName(): string {
    return this.block.content.file?.name || 'Unknown file';
  }

  get fileSize(): number {
    return this.block.content.file?.size || 0;
  }

  get formattedSize(): string {
    const bytes = this.fileSize;
    if (bytes === 0) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  get fileIcon(): string {
    const name = this.fileName.toLowerCase();
    if (name.endsWith('.pdf')) return 'picture_as_pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'description';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'table_chart';
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'slideshow';
    if (name.endsWith('.zip') || name.endsWith('.rar')) return 'folder_zip';
    if (name.endsWith('.mp3') || name.endsWith('.wav')) return 'audio_file';
    if (name.endsWith('.mp4') || name.endsWith('.mov')) return 'video_file';
    return 'insert_drive_file';
  }

  onBlockClick(): void {
    this.focus.emit();
  }

  triggerUpload(event: Event): void {
    event.stopPropagation();
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadRequest.emit({ blockId: this.block.id, file });
    }
    input.value = '';
  }
}
