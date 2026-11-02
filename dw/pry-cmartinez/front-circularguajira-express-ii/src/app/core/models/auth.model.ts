import { Status } from './api.model';
import { HttpMethod } from './resource.model';

/** POST /api/session/login and /refresh: only the token pair. */
export interface SessionTokens {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

/** GET /api/session/profile */
export interface Profile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: Status;
  roles: string[];
}

/** One row of GET /api/session/permissions (`{ permissions }`). */
export interface EffectivePermission {
  resourceId: number;
  method: HttpMethod;
  path: string;
}

/** Body of POST /api/session/refresh and /logout: the opaque refresh token. */
export interface RefreshPayload {
  refreshToken: string;
}

/** State kept by SessionStore: profile (with its roles) + effective permissions. */
export interface AccessPayload {
  user: Profile;
  permissions: EffectivePermission[];
}
