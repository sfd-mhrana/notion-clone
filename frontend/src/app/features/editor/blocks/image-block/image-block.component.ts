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
import { Block, BlockContent } from '../../editor.models';

@Component({
  selector: 'app-image-block',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="image-block" [class.has-image]="hasImage" (click)="onBlockClick()">
      @if (hasImage) {
        <div class="image-wrapper">
          <img [src]="imageUrl" [alt]="caption" (load)="onImageLoad()" />
          @if (focused) {
            <div class="image-controls">
              <button mat-icon-button (click)="removeImage($event)" title="Remove image">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          }
        </div>
        <input
          type="text"
          class="image-caption"
          placeholder="Add a caption..."
          [value]="caption"
          (input)="onCaptionChange($event)"
        />
      } @else {
        <div class="upload-placeholder" (click)="triggerUpload($event)">
          <mat-icon>image</mat-icon>
          <span>Add an image</span>
          <span class="hint">Click to upload or drag and drop</span>
        </div>
        <input
          #fileInput
          type="file"
          accept="image/*"
          class="file-input"
          (change)="onFileSelected($event)"
        />
      }
    </div>
  `,
  styles: [`
    .image-block {
      margin: 8px 0;
      border-radius: 4px;
      overflow: hidden;
    }

    .image-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
    }

    .image-wrapper img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }

    .image-controls {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 4px;
      padding: 4px;
    }

    .image-caption {
      width: 100%;
      border: none;
      padding: 8px 4px;
      font-size: 14px;
      color: rgba(55, 53, 47, 0.6);
      background: transparent;
      text-align: center;
      outline: none;
    }

    .image-caption:focus {
      color: rgba(55, 53, 47, 0.8);
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
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
      font-size: 48px;
      width: 48px;
      height: 48px;
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
export class ImageBlockComponent {
  @Input() block!: Block;
  @Input() focused = false;

  @Output() contentChange = new EventEmitter<BlockContent>();
  @Output() focus = new EventEmitter<void>();
  @Output() uploadRequest = new EventEmitter<{ blockId: string; file: File }>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  get hasImage(): boolean {
    return !!this.block.content.url || !!this.block.content.file?.url;
  }

  get imageUrl(): string {
    return this.block.content.url || this.block.content.file?.url || '';
  }

  get caption(): string {
    if (!this.block.content.caption) return '';
    return this.block.content.caption.map(rt => rt.plain_text).join('');
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

      // Preview the image immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const content: BlockContent = {
          ...this.block.content,
          url: e.target?.result as string,
        };
        this.contentChange.emit(content);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onCaptionChange(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    const content: BlockContent = {
      ...this.block.content,
      caption: text ? [{ type: 'text', text: { text }, annotations: {}, plain_text: text }] : [],
    };
    this.contentChange.emit(content);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    const content: BlockContent = {
      ...this.block.content,
      url: undefined,
      file: undefined,
    };
    this.contentChange.emit(content);
  }

  onImageLoad(): void {
    // Image loaded successfully
  }
}
