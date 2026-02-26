import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SearchModalComponent } from './search-modal/search-modal.component';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly dialog = inject(MatDialog);

  openSearchModal(): void {
    this.dialog.open(SearchModalComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'search-modal-panel',
      autoFocus: true,
    });
  }
}
