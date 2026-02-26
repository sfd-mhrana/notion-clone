import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="file-upload"
      [class.dragging]="isDragging()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <!-- Upload Area -->
      <div class="upload-area" (click)="triggerFileInput()">
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <div class="upload-text">
          <span class="primary-text">
            {{ isDragging() ? 'Drop files here' : 'Click to upload or drag and drop' }}
          </span>
          <span class="secondary-text">
            {{ acceptTypes ? 'Accepted: ' + acceptTypes : 'Any file type' }}
            {{ maxSize ? ' • Max ' + formatSize(maxSize) : '' }}
          </span>
        </div>
      </div>

      <input
        #fileInput
        type="file"
        class="file-input"
        [accept]="acceptTypes"
        [multiple]="multiple"
        (change)="onFileSelected($event)"
      />

      <!-- Upload Queue -->
      @if (uploadQueue().length > 0) {
        <div class="upload-queue">
          @for (upload of uploadQueue(); track upload.id) {
            <div class="upload-item" [class.error]="upload.status === 'error'">
              <mat-icon class="file-icon">{{ getFileIcon(upload.file) }}</mat-icon>
              <div class="file-info">
                <span class="file-name">{{ upload.file.name }}</span>
                <span class="file-size">{{ formatSize(upload.file.size) }}</span>
              </div>
              @if (upload.status === 'uploading') {
                <mat-progress-bar
                  mode="determinate"
                  [value]="upload.progress"
                  class="progress-bar"
                ></mat-progress-bar>
              }
              @if (upload.status === 'completed') {
                <mat-icon class="status-icon success">check_circle</mat-icon>
              }
              @if (upload.status === 'error') {
                <mat-icon class="status-icon error">error</mat-icon>
              }
              <button
                class="remove-btn"
                (click)="removeFromQueue(upload.id)"
                [disabled]="upload.status === 'uploading'"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .file-upload {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      border: 2px dashed rgba(55, 53, 47, 0.16);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(55, 53, 47, 0.02);
    }

    .file-upload.dragging .upload-area {
      border-color: #2383e2;
      background: rgba(35, 131, 226, 0.08);
    }

    .upload-area:hover {
      border-color: rgba(55, 53, 47, 0.3);
      background: rgba(55, 53, 47, 0.04);
    }

    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: rgba(55, 53, 47, 0.4);
      margin-bottom: 12px;
    }

    .file-upload.dragging .upload-icon {
      color: #2383e2;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .primary-text {
      font-size: 16px;
      color: rgba(55, 53, 47, 0.8);
    }

    .secondary-text {
      font-size: 13px;
      color: rgba(55, 53, 47, 0.5);
    }

    .file-input {
      display: none;
    }

    .upload-queue {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .upload-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: rgba(55, 53, 47, 0.04);
      border-radius: 6px;
    }

    .upload-item.error {
      background: rgba(224, 62, 62, 0.08);
    }

    .file-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
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
      color: rgba(55, 53, 47, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
    }

    .progress-bar {
      width: 100px;
      flex-shrink: 0;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.success {
      color: #0d9c0d;
    }

    .status-icon.error {
      color: #e03e3e;
    }

    .remove-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: rgba(55, 53, 47, 0.5);
    }

    .remove-btn:hover:not(:disabled) {
      background: rgba(55, 53, 47, 0.08);
      color: rgba(55, 53, 47, 0.8);
    }

    .remove-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .remove-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
})
export class FileUploadComponent {
  @Input() acceptTypes = '';
  @Input() maxSize = 10 * 1024 * 1024; // 10MB default
  @Input() multiple = false;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() uploadStart = new EventEmitter<UploadFile>();
  @Output() uploadProgress = new EventEmitter<{ id: string; progress: number }>();
  @Output() uploadComplete = new EventEmitter<{ id: string; url: string }>();
  @Output() uploadError = new EventEmitter<{ id: string; error: string }>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  readonly isDragging = signal(false);
  readonly uploadQueue = signal<UploadFile[]>([]);

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      if (this.maxSize && file.size > this.maxSize) {
        console.warn(`File ${file.name} exceeds max size`);
        return false;
      }
      if (this.acceptTypes) {
        const acceptedTypes = this.acceptTypes.split(',').map(t => t.trim());
        const fileType = file.type || this.getExtension(file.name);
        if (!acceptedTypes.some(t => fileType.includes(t) || t.includes(fileType))) {
          console.warn(`File ${file.name} type not accepted`);
          return false;
        }
      }
      return true;
    });

    if (validFiles.length > 0) {
      const newUploads: UploadFile[] = validFiles.map(file => ({
        id: this.generateId(),
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      this.uploadQueue.update(queue => [...queue, ...newUploads]);
      this.filesSelected.emit(validFiles);

      // Emit upload start for each file
      newUploads.forEach(upload => {
        this.uploadStart.emit(upload);
      });
    }
  }

  removeFromQueue(id: string): void {
    this.uploadQueue.update(queue => queue.filter(u => u.id !== id));
  }

  updateProgress(id: string, progress: number): void {
    this.uploadQueue.update(queue =>
      queue.map(u => u.id === id ? { ...u, progress, status: 'uploading' as const } : u)
    );
    this.uploadProgress.emit({ id, progress });
  }

  completeUpload(id: string, url: string): void {
    this.uploadQueue.update(queue =>
      queue.map(u => u.id === id ? { ...u, progress: 100, status: 'completed' as const, url } : u)
    );
    this.uploadComplete.emit({ id, url });
  }

  failUpload(id: string, error: string): void {
    this.uploadQueue.update(queue =>
      queue.map(u => u.id === id ? { ...u, status: 'error' as const, error } : u)
    );
    this.uploadError.emit({ id, error });
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video_file';
    if (type.startsWith('audio/')) return 'audio_file';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('document')) return 'description';
    if (type.includes('sheet') || type.includes('excel')) return 'table_chart';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'slideshow';
    if (type.includes('zip') || type.includes('rar')) return 'folder_zip';
    return 'insert_drive_file';
  }

  private getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
