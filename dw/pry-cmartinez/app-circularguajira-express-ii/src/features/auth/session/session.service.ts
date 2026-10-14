import { UsersRepository } from "../users/users.repository";
import { User } from "../users/user.model";
import { RoleUsersRepository } from "../role-users/role-users.repository";
import { EffectivePermission, EffectivePermissionsRepository } from "../access/effective-permissions.repository";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";
import { ProfileDto, SessionTokensDto } from "./dto/session.dto";
import { parseLogin, parseRefreshToken } from "./dto/session.validation";
import { hashPassword, verifyPassword } from "../../../shared/auth/password";
import { signAccessToken } from "../../../shared/auth/jwt";
import { NotFoundError, UnauthorizedError } from "../../../shared/errors/httpError";

const INVALID_CREDENTIALS = "Credenciales inválidas";

// Compared against when the user does not exist, so both failures cost one bcrypt check
// and the response time does not reveal which usernames exist.
const dummyHash = hashPassword("dummy-password-0");

/**
 * Session lifecycle on top of the pieces already built:
 *  - login (OPEN): same 401 for unknown user, wrong password or inactive user (no user
 *    enumeration); opens a refresh token family and signs a short access token.
 *  - refresh (OPEN, refresh token in the body): rotates through RefreshTokensService and
 *    maps its outcome to 401 after the transaction committed (reuse revokes the family).
 *    The refresh window restarts on each rotation, so an active user is never logged out.
 *  - logout (OPEN, refresh token in the body): revokes that session, idempotent.
 *  - profile and own permissions (JWT): the identity resolved by `authenticate`.
 */
export class SessionService {
  constructor(
    private readonly usersRepository = new UsersRepository(),
    private readonly roleUsersRepository = new RoleUsersRepository(),
    private readonly effectivePermissionsRepository = new EffectivePermissionsRepository(),
    private readonly refreshTokensService = new RefreshTokensService()
  ) {}

  // ================== OPEN ==================

  async login(body: unknown, deviceInfo: string | null): Promise<SessionTokensDto> {
    const input = parseLogin(body);
    const user = await this.usersRepository.findByIdentifierWithPassword(input.identifier);
    const matches = await verifyPassword(input.password, user?.password ?? (await dummyHash));
    if (!user || !matches || user.status !== "active") {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }
    const session = await this.refreshTokensService.issue(user.id, deviceInfo);
    return buildTokens(user, session.rawToken, session.expiresAt);
  }

  async refresh(body: unknown, deviceInfo: string | null): Promise<SessionTokensDto> {
    const { refreshToken } = parseRefreshToken(body);
    const outcome = await this.refreshTokensService.rotate(refreshToken, deviceInfo);
    switch (outcome.kind) {
      case "invalid":
        throw new UnauthorizedError("Refresh token inválido");
      case "expired":
        throw new UnauthorizedError("Refresh token expirado: inicia sesión de nuevo");
      case "reuse":
        throw new UnauthorizedError("Refresh token reutilizado: la sesión se revocó por seguridad");
    }
    // A deactivated user cannot renew, even with a valid refresh token.
    const user = await this.usersRepository.findById(outcome.userId);
    if (!user || user.status !== "active") {
      await this.refreshTokensService.revokeAllMine(outcome.userId);
      throw new UnauthorizedError("Usuario inexistente o inactivo");
    }
    return buildTokens(user, outcome.rawToken, outcome.expiresAt);
  }

  async logout(body: unknown): Promise<void> {
    const { refreshToken } = parseRefreshToken(body);
    await this.refreshTokensService.revokeByToken(refreshToken);
  }

  // ================== JWT ==================

  async profile(userId: number): Promise<ProfileDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`Usuario no encontrado: ${userId}`);
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      roles: await this.roleUsersRepository.findActiveRoleNamesByUser(user.id),
    };
  }

  // The same query `authorize` uses: what is listed here is exactly what is allowed.
  myPermissions(userId: number): Promise<EffectivePermission[]> {
    return this.effectivePermissionsRepository.findForUser(userId);
  }
}

const buildTokens = (user: User, refreshToken: string, refreshExpiresAt: Date): SessionTokensDto => {
  const access = signAccessToken(user);
  return {
    accessToken: access.token,
    tokenType: "Bearer",
    expiresIn: access.expiresIn,
    refreshToken,
    refreshExpiresIn: Math.max(0, Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)),
  };
};
