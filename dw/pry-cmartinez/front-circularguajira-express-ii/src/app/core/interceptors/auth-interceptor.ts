import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionTokens } from '../models/auth.model';
import { AuthService } from '../services/auth';
import { SessionStore } from '../services/session-store';

/**
 * A single renewal in flight for every concurrent request: if three requests receive a 401
 * at once, `/session/refresh` is called once. It must be a module variable shared with `??=`;
 * two parallel refreshes would present the same token twice and the backend would revoke
 * the whole family (reuse detection).
 */
let refreshInFlight: Observable<SessionTokens> | null = null;

/** OPEN calls: the credential travels in the body; no Bearer and no retry. */
const PUBLIC_SESSION_CALLS = ['/session/login', '/session/refresh', '/session/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStore);
  const auth = inject(AuthService);
  const router = inject(Router);

  // The token only travels to our API, never to third-party URLs.
  const isApiCall = req.url.startsWith(environment.apiUrl);
  const isPublicSessionCall = PUBLIC_SESSION_CALLS.some((path) => req.url.includes(path));
  const withBearer = (token: string | null) =>
    token && isApiCall && !isPublicSessionCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(withBearer(session.accessToken())).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiCall ||
        isPublicSessionCall ||
        !environment.requireAuth
      ) {
        return throwError(() => error);
      }

      if (!session.refreshToken()) {
        redirectToLogin(session, router);
        return throwError(() => error);
      }

      refreshInFlight ??= auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          // Expired, revoked or reused refresh token: the session is over.
          redirectToLogin(session, router);
          return throwError(() => refreshError);
        }),
        finalize(() => {
          refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

      // Waits for the shared refresh and retries the original request with the new access.
      return refreshInFlight.pipe(switchMap(() => next(withBearer(session.accessToken()))));
    }),
  );
};

/**
 * Ends the session in a controlled way. `reason=expired` lets the login explain why it is
 * shown (a toast would die with the Shell, which is destroyed when leaving it).
 */
function redirectToLogin(session: SessionStore, router: Router): void {
  session.clear();
  const current = router.url;
  const returnUrl = current.startsWith('/login') ? '/dashboard' : current;
  void router.navigate(['/login'], { queryParams: { returnUrl, reason: 'expired' } });
}
