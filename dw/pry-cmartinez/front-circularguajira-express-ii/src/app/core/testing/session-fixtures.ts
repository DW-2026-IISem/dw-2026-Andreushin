import { TestBed } from '@angular/core/testing';
import { EffectivePermission, Profile, SessionTokens } from '../models/auth.model';
import { SessionStore } from '../services/session-store';
import { ROLE_PERMISSIONS, SeedRole } from './role-permissions';

/** Shapes copied from the real answers of `app-circularguajira-express-ii` (seed user `admin`). */
export const TOKENS: SessionTokens = {
  accessToken: 'access-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: 'refresh-1',
  refreshExpiresIn: 604800,
};

export const PROFILE: Profile = {
  id: 1,
  username: 'admin',
  email: 'admin@circularguajira.co',
  avatar: null,
  status: 'active',
  roles: ['ADMIN'],
};

export const PERMISSIONS: EffectivePermission[] = [
  { resourceId: 1, method: 'GET', path: '/api/recyclers' },
  { resourceId: 3, method: 'PATCH', path: '/api/recyclers/:id' },
];

/** Starts a session in the TestBed's SessionStore with the real grants of a seeded role. */
export function signInAs(role: SeedRole): void {
  const session = TestBed.inject(SessionStore);
  session.setTokens(TOKENS);
  session.setAccess({
    user: { ...PROFILE, username: role.toLowerCase(), roles: [role] },
    permissions: ROLE_PERMISSIONS[role],
  });
}
