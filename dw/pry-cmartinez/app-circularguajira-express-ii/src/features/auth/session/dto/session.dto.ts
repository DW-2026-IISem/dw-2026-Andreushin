import { UserStatus } from "../../users/user.model";

// POST /api/session/login: username or email in one field.
export interface LoginDto {
  identifier: string;
  password: string;
}

// POST /api/session/refresh and /logout. The refresh token travels in the body, not in
// `Authorization`: it is a session credential, not an access token.
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Response of login and refresh: the token pair. The plain refresh token is returned only
 * here (the server keeps its SHA-256); `expiresIn` lets the client renew before expiry.
 */
export interface SessionTokensDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

// GET /api/session/profile: public identity plus active roles; never the password.
export interface ProfileDto {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: UserStatus;
  roles: string[];
}
