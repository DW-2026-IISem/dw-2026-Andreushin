import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../services/session-store';

/**
 * What can you do? Declared on the route: `data: { permission: 'GET /api/recyclers' }`.
 * Deny by default: without the grant it sends to `/forbidden?permission=…`. It is a visual
 * aid; Express validates again with `authorize` (403).
 */
export const permissionGuard: CanActivateFn = (route) => {
  if (!environment.requireAuth) {
    return true;
  }
  const permission = route.data?.['permission'] as string | undefined;
  if (!permission || inject(SessionStore).canPermission(permission)) {
    return true;
  }
  return inject(Router).createUrlTree(['/forbidden'], { queryParams: { permission } });
};
