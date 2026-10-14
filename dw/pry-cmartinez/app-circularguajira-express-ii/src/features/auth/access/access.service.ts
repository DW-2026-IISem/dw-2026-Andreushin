import { UsersRepository } from "../users/users.repository";
import { AuthUser } from "../../../shared/auth/auth-user";
import { extractBearerToken, verifyAccessToken } from "../../../shared/auth/jwt";
import { UnauthorizedError } from "../../../shared/errors/httpError";

/**
 * Identity resolution for protected routes. The JWT proves who signed in; the database is
 * still asked on every request whether that user is active, so deactivating a user takes
 * effect immediately (401) instead of when the token expires.
 */
export class AccessService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

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
}
