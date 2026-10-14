import { NextFunction, Request, Response } from "express";
import { AccessService } from "./access.service";
import { handleError } from "../../../shared/http/handleError";

const accessService = new AccessService();

/**
 * JWT + RBAC access mode, mounted after `authenticate`: the user in `req.auth` must reach
 * the request's (method, path) through active links
 *
 *   role_users -> roles -> resource_roles -> resources (method, path pattern)
 *
 * otherwise 403 (deny by default); 401 if there is no identity. It takes no parameters:
 * the resource is derived from the request, so granting is inserting rows, never code.
 */
export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await accessService.assertGranted(req.auth, req.method, req.originalUrl);
    next();
  } catch (error) {
    handleError(res, error);
  }
};
