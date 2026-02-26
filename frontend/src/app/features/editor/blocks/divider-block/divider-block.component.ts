import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Block } from '../../editor.models';

@Component({
  selector: 'app-divider-block',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="divider-block">
      <hr class="divider" />
    </div>
  `,
  styles: [`
    .divider-block {
      padding: 8px 0;
      cursor: default;
    }

    .divider {
      border: none;
      border-top: 1px solid rgba(55, 53, 47, 0.16);
      margin: 0;
    }
  `],
})
export class DividerBlockComponent {
  @Input() block!: Block;
}
