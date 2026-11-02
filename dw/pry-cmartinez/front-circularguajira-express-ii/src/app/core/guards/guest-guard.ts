import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';

/** A user who already has a session does not go back to the login: it opens the panel. */
export const guestGuard: CanActivateFn = () => {
  if (!environment.requireAuth || !inject(SessionStore).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree(['/dashboard']);
};
