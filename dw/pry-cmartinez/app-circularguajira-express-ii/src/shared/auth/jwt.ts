import jwt, { JwtPayload } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { UnauthorizedError } from "../errors/httpError";

/**
 * Access token: signed JWT (HS256), self-contained and never stored.
 *  - RFC 8725 §3.1: the algorithm is fixed in code, never taken from the token header.
 *  - RFC 8725 §3.8/3.9: issuer and audience are required on verification.
 *  - RFC 6750: sent as `Authorization: Bearer <token>`.
 * Minimal payload (sub, username, jti): roles never travel in the token, so revoking a
 * grant takes effect on the next request (authorization is resolved per request).
 */
const ALGORITHM = "HS256";

export const TOKEN_ISSUER = "app-circularguajira-express";
export const TOKEN_AUDIENCE = "app-circularguajira-api";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  username: string;
  jti: string;
}

export const accessTokenTtlSeconds = (): number => Number(process.env.JWT_ACCESS_TTL ?? 900);

// A missing or short secret is a server misconfiguration (500), not a client error.
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET is not configured (minimum 32 characters, see .env)");
  }
  return secret;
};

export const signAccessToken = (user: { id: number; username: string }): { token: string; expiresIn: number } => {
  const expiresIn = accessTokenTtlSeconds();
  const token = jwt.sign({ username: user.username }, getSecret(), {
    algorithm: ALGORITHM,
    subject: String(user.id),
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn,
    jwtid: randomUUID(),
  });
  return { token, expiresIn };
};

/**
 * Verifies signature and claims with explicit options. jsonwebtoken has no `require`
 * option, so `sub` (positive integer) and `jti` are checked by hand. Any failure is a 401.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, getSecret(), {
      algorithms: [ALGORITHM],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      clockTolerance: 5,
    });
  } catch {
    throw new UnauthorizedError("Token de acceso inválido o expirado");
  }
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    typeof payload.jti !== "string" ||
    payload.jti.length === 0 ||
    typeof payload.username !== "string"
  ) {
    throw new UnauthorizedError("Token de acceso inválido o expirado");
  }
  return payload as AccessTokenPayload;
};

// Token from `Authorization: Bearer <token>` (RFC 6750); null when absent or malformed.
export const extractBearerToken = (header: string | undefined): string | null => {
  if (!header) return null;
  const [scheme, value, extra] = header.trim().split(/\s+/);
  if (!scheme || !value || extra !== undefined || scheme.toLowerCase() !== "bearer") return null;
  return value;
};
