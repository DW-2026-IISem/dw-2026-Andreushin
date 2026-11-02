import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session-store';

/** A user who already has a session does not go back to the login: it opens the panel. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionStore);
  return session.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
