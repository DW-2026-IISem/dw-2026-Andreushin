import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../services/session-store';

/**
 * Screens that only exist with a session (profile, and the RBAC administration of ISS-10).
 * In lab mode (`requireAuth: false`) the backend would answer 401, so they go to the panel.
 */
export const authOnlyGuard: CanActivateFn = () =>
  inject(SessionStore).authEnabled ? true : inject(Router).createUrlTree(['/dashboard']);
