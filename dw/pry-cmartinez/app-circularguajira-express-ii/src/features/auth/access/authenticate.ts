import { NextFunction, Request, Response } from "express";
import { AccessService } from "./access.service";
import { handleError } from "../../../shared/http/handleError";

const accessService = new AccessService();

/**
 * JWT access mode: a valid Bearer token of an active user, or 401. Leaves the identity in
 * `req.auth`. It never looks at permissions: `authorize` (403) is chained after it for RBAC.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    req.auth = await accessService.resolveIdentity(req.headers.authorization);
    next();
  } catch (error) {
    handleError(res, error);
  }
};
