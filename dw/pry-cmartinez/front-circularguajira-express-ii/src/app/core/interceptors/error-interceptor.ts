import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification';
import { toApiMessage } from '../utils/api-error';

/**
 * Translates cross-cutting failures into a toast: 403 (RBAC), 5xx and backend offline.
 * Business errors (400, 404, 409) are left to each screen, which knows their context, and
 * the session calls show their own error in the login form. The error is always re-thrown.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && !req.url.includes('/session/')) {
        if (error.status === 403) {
          notify.warn('Acceso denegado', 'Tu rol no tiene permiso para esta operación.');
        } else if (error.status === 0) {
          notify.error('Sin conexión', toApiMessage(error));
        } else if (error.status >= 500) {
          notify.error('Error del servidor', toApiMessage(error));
        }
      }
      return throwError(() => error);
    }),
  );
};
