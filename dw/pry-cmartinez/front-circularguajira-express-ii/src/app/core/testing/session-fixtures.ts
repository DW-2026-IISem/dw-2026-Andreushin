import { EffectivePermission, Profile, SessionTokens } from '../models/auth.model';

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
