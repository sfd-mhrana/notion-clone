import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { TokenService } from './core/auth/token.service';
import { AuthActions } from './store/auth/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly store = inject(Store);
  private readonly tokenService = inject(TokenService);

  async ngOnInit(): Promise<void> {
    // Try to restore session from refresh token cookie
    const hasSession = await this.tokenService.initializeAuth();

    if (hasSession) {
      // Load current user data into the store
      this.store.dispatch(AuthActions.loadCurrentUser());
    }
  }
}
