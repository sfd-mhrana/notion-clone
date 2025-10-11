import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SidebarComponent } from './components/sidebar.component';
import { PageEditorComponent } from './components/page-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SidebarComponent, PageEditorComponent],
  template: `
    <div class="app-container">
      <app-sidebar (pageSelected)="onPageSelected($event)"></app-sidebar>
      <app-page-editor [pageId]="selectedPageId"></app-page-editor>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class App {
  selectedPageId: string | null = null;

  onPageSelected(pageId: string) {
    this.selectedPageId = pageId;
  }
}

bootstrapApplication(App);
