import { RefreshToken, RefreshTokenStatus } from "../refresh-token.model";

/**
 * A persisted session as the API returns it. `tokenHash` is left out on purpose: not even
 * the hash of a credential leaves the API, and the `id` is enough to revoke it.
 */
export interface RefreshTokenResponseDto {
  id: number;
  userId: number;
  familyId: string;
  deviceInfo: string | null;
  expiresAt: Date;
  status: RefreshTokenStatus;
  // Derived, not a column: expiresAt already passed.
  isExpired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Model -> plain response object, built field by field so a new column never leaks.
export const toRefreshTokenResponse = (token: RefreshToken): RefreshTokenResponseDto => ({
  id: token.id,
  userId: token.userId,
  familyId: token.familyId,
  deviceInfo: token.deviceInfo,
  expiresAt: token.expiresAt,
  status: token.status,
  isExpired: new Date(token.expiresAt).getTime() <= Date.now(),
  createdAt: token.createdAt,
  updatedAt: token.updatedAt,
});
