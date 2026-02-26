import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const store = inject(Store);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      switch (error.status) {
        case 0:
          message = 'You appear to be offline';
          break;
        case 403:
          message = "You don't have permission to do this";
          break;
        case 404:
          message = 'Not found';
          break;
        case 500:
          message = 'Something went wrong. Please try again.';
          break;
        default:
          message = error.error?.message || 'An unexpected error occurred';
      }

      // TODO: Dispatch toast notification action when UI store is implemented
      // store.dispatch(UiActions.showToast({ message, type: 'error' }));
      console.error(`HTTP Error: ${error.status} - ${message}`);

      return throwError(() => error);
    })
  );
};
