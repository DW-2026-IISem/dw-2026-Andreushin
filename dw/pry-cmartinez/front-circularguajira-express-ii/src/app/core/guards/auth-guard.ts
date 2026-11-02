import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session-store';

/**
 * Requires a session (Phase II). Without one, it sends to `/login?returnUrl=<requested url>`
 * so the login can come back. Permission checks per route arrive in ISS-09.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  if (!session.authEnabled || session.isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
