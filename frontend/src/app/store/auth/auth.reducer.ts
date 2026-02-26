import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/auth/auth.service';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const authInitialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  authInitialState,

  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.register, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.registerSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    error: null,
  })),

  on(AuthActions.registerFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.logoutSuccess, () => ({
    ...authInitialState,
  })),

  on(AuthActions.loadCurrentUser, (state) => ({
    ...state,
    loading: true,
  })),

  on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
  })),

  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(AuthActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
