import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { User } from '../../core/auth/auth.service';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Login': props<{ email: string; password: string }>(),
    'Login Success': props<{ user: User; accessToken: string }>(),
    'Login Failure': props<{ error: string }>(),

    'Register': props<{ email: string; password: string; name: string }>(),
    'Register Success': props<{ user: User; accessToken: string }>(),
    'Register Failure': props<{ error: string }>(),

    'Logout': emptyProps(),
    'Logout Success': emptyProps(),

    'Refresh Token': emptyProps(),
    'Refresh Token Success': props<{ accessToken: string }>(),
    'Refresh Token Failure': props<{ error: string }>(),

    'Load Current User': emptyProps(),
    'Load Current User Success': props<{ user: User }>(),
    'Load Current User Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),
  },
});
