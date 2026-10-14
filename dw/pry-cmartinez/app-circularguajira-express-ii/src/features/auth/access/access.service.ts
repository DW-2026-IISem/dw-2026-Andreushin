import { UsersRepository } from "../users/users.repository";
import { EffectivePermissionsRepository } from "./effective-permissions.repository";
import { AuthUser } from "../../../shared/auth/auth-user";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { isOperationGranted, normalizePath } from "../../../shared/auth/resource-match";
import { ForbiddenError, UnauthorizedError } from "../../../shared/errors/httpError";

/**
 * Access decisions for protected routes, used by the two middlewares:
 *  - `resolveIdentity` (JWT mode): the token proves who signed in; the database is still
 *    asked on every request whether that user is active, so deactivating a user takes
 *    effect immediately (401) instead of when the token expires.
 *  - `assertGranted` (JWT + RBAC mode): the (method, path) of the request must be covered
 *    by an active grant of the user (deny by default, 403). Permissions never travel in the
 *    token, so revoking a grant also takes effect on the next request.
 */
export class AccessService {
  constructor(
    private readonly usersRepository = new UsersRepository(),
    private readonly effectivePermissionsRepository = new EffectivePermissionsRepository()
  ) {}

  async resolveIdentity(authorizationHeader: string | undefined): Promise<AuthUser> {
    const token = extractBearerToken(authorizationHeader);
    if (!token) {
      throw new UnauthorizedError("Falta el token de acceso (Authorization: Bearer <token>)");
    }
    const payload = verifyAccessToken(token);
    const user = await this.usersRepository.findById(Number(payload.sub));
    if (!user || user.status !== "active") {
      throw new UnauthorizedError("Usuario inexistente o inactivo");
    }
    return { id: user.id, username: user.username, email: user.email, tokenId: payload.jti };
  }

  async assertGranted(user: AuthUser | undefined, method: string, url: string): Promise<void> {
    if (!user) {
      throw new UnauthorizedError();
    }
    const verb = method.toUpperCase();
    const path = normalizePath(url);
    const granted = await this.effectivePermissionsRepository.findForUser(user.id);
    if (!isOperationGranted(granted, verb, path)) {
      throw new ForbiddenError(`No tienes permiso para ${verb} ${path}`);
    }
  }
}
