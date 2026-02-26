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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

type AIAction = 'write' | 'summarize' | 'expand' | 'improve' | 'fix_grammar' | 'translate' | 'explain' | 'brainstorm';

interface AIActionItem {
  id: AIAction;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ai-assistant" [class.open]="isOpen()">
      <!-- Trigger Button -->
      <button class="ai-trigger" [matMenuTriggerFor]="aiMenu" (menuOpened)="isOpen.set(true)" (menuClosed)="isOpen.set(false)">
        <mat-icon>auto_awesome</mat-icon>
        <span>Ask AI</span>
      </button>

      <mat-menu #aiMenu="matMenu" class="ai-menu">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="24"></mat-spinner>
            <span>Processing...</span>
          </div>
        } @else if (result()) {
          <div class="result-state">
            <div class="result-header">
              <span>AI Result</span>
              <button mat-icon-button (click)="clearResult()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="result-content">{{ result() }}</div>
            <div class="result-actions">
              <button mat-button (click)="insertResult()">
                <mat-icon>add</mat-icon> Insert
              </button>
              <button mat-button (click)="copyResult()">
                <mat-icon>content_copy</mat-icon> Copy
              </button>
            </div>
          </div>
        } @else {
          <div class="actions-list">
            @for (action of actions; track action.id) {
              <button mat-menu-item (click)="executeAction(action.id)">
                <mat-icon>{{ action.icon }}</mat-icon>
                <div class="action-content">
                  <span class="action-label">{{ action.label }}</span>
                  <span class="action-description">{{ action.description }}</span>
                </div>
              </button>
            }
          </div>

          @if (needsInput()) {
            <div class="input-section">
              <input
                type="text"
                class="ai-input"
                [placeholder]="inputPlaceholder()"
                [(ngModel)]="inputValue"
                (keydown.enter)="submitInput()"
              />
              <button mat-icon-button (click)="submitInput()">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          }
        }
      </mat-menu>
    </div>
  `,
  styles: [`
    .ai-assistant {
      display: inline-flex;
    }

    .ai-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: opacity 0.2s ease;
    }

    .ai-trigger:hover {
      opacity: 0.9;
    }

    .ai-trigger mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    ::ng-deep .ai-menu {
      min-width: 320px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      justify-content: center;
    }

    .result-state {
      padding: 12px;
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .result-content {
      background: rgba(55, 53, 47, 0.04);
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    .result-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .actions-list {
      padding: 8px 0;
    }

    .action-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-left: 8px;
    }

    .action-label {
      font-weight: 500;
    }

    .action-description {
      font-size: 12px;
      color: rgba(55, 53, 47, 0.5);
    }

    .input-section {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-top: 1px solid rgba(55, 53, 47, 0.09);
    }

    .ai-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid rgba(55, 53, 47, 0.16);
      border-radius: 4px;
      outline: none;
      font-size: 14px;
    }

    .ai-input:focus {
      border-color: #667eea;
    }
  `],
})
export class AIAssistantComponent {
  @Input() selectedText = '';
  @Input() context = '';

  @Output() resultInsert = new EventEmitter<string>();

  private readonly http = inject(HttpClient);

  readonly isOpen = signal(false);
  readonly loading = signal(false);
  readonly result = signal('');
  readonly needsInput = signal(false);
  readonly inputPlaceholder = signal('');

  inputValue = '';
  private pendingAction: AIAction | null = null;

  actions: AIActionItem[] = [
    { id: 'write', label: 'Write', icon: 'edit', description: 'Generate content on a topic' },
    { id: 'summarize', label: 'Summarize', icon: 'compress', description: 'Shorten and summarize text' },
    { id: 'expand', label: 'Expand', icon: 'unfold_more', description: 'Add more detail and context' },
    { id: 'improve', label: 'Improve', icon: 'auto_fix_high', description: 'Make writing clearer and better' },
    { id: 'fix_grammar', label: 'Fix Grammar', icon: 'spellcheck', description: 'Correct grammar and spelling' },
    { id: 'translate', label: 'Translate', icon: 'translate', description: 'Translate to another language' },
    { id: 'explain', label: 'Explain', icon: 'help_outline', description: 'Explain in simpler terms' },
    { id: 'brainstorm', label: 'Brainstorm', icon: 'lightbulb', description: 'Generate ideas and suggestions' },
  ];

  executeAction(action: AIAction): void {
    // Some actions need input first
    if (action === 'write' || action === 'brainstorm') {
      this.pendingAction = action;
      this.needsInput.set(true);
      this.inputPlaceholder.set(action === 'write' ? 'What should I write about?' : 'What topic to brainstorm?');
      return;
    }

    if (action === 'translate') {
      this.pendingAction = action;
      this.needsInput.set(true);
      this.inputPlaceholder.set('Target language (e.g., Spanish, French)');
      return;
    }

    // Check if we have text to process
    if (!this.selectedText && !this.context) {
      return;
    }

    this.callAI(action, this.selectedText || this.context);
  }

  submitInput(): void {
    if (!this.inputValue.trim() || !this.pendingAction) return;

    const action = this.pendingAction;
    const content = this.pendingAction === 'translate'
      ? (this.selectedText || this.context)
      : this.inputValue;
    const language = this.pendingAction === 'translate' ? this.inputValue : undefined;

    this.needsInput.set(false);
    this.inputValue = '';
    this.pendingAction = null;

    this.callAI(action, content, language);
  }

  private callAI(action: AIAction, content: string, language?: string): void {
    this.loading.set(true);

    const body: Record<string, string> = { action, content };
    if (language) body['language'] = language;
    if (this.context) body['context'] = this.context;

    this.http.post<{ result: string }>(`${environment.apiUrl}/api/ai/process`, body)
      .subscribe({
        next: (response) => {
          this.result.set(response.result);
          this.loading.set(false);
        },
        error: () => {
          this.result.set('AI processing failed. Please try again.');
          this.loading.set(false);
        },
      });
  }

  clearResult(): void {
    this.result.set('');
  }

  insertResult(): void {
    if (this.result()) {
      this.resultInsert.emit(this.result());
      this.clearResult();
    }
  }

  copyResult(): void {
    if (this.result()) {
      navigator.clipboard.writeText(this.result());
    }
  }
}
