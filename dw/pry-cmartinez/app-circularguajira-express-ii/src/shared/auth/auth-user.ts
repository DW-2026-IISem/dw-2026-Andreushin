import { Request } from "express";
import { UnauthorizedError } from "../errors/httpError";

// Identity resolved by `authenticate` (ISS-13) and stored in `req.auth`.
export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  // JWT id of the access token used (lets a user close the current session).
  tokenId?: string;
}

// Identity of the request or 401; used by JWT-only controllers without the `!` operator.
export const requireAuthUser = (req: Request): AuthUser => {
  if (!req.auth) {
    throw new UnauthorizedError();
  }
  return req.auth;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // Set by `authenticate`; undefined on OPEN routes.
      auth?: AuthUser;
    }
  }
}
