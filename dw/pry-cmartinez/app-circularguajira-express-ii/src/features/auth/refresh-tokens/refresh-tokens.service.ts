import { randomUUID } from "node:crypto";
import { Transaction } from "sequelize";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { RefreshToken } from "./refresh-token.model";
import { RefreshTokenResponseDto, toRefreshTokenResponse } from "./dto/refresh-token.dto";
import { generateOpaqueToken, sha256Hex } from "../../../shared/auth/password";
import { withTransaction } from "../../../shared/database/transaction";
import { NotFoundError } from "../../../shared/errors/httpError";
import { parseId } from "../../../shared/http/parseId";

// Refresh token lifetime (days); every rotation starts a new window.
const refreshTtlDays = (): number => Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7);

export interface IssuedSession {
  // Returned once to the client; only its SHA-256 is stored.
  rawToken: string;
  familyId: string;
  expiresAt: Date;
}

/**
 * Result of a rotation attempt, as a discriminated union instead of an exception: throwing
 * inside the transaction would roll back the family revocation just written on reuse. The
 * session feature (ISS-15) maps it to an HTTP error after the commit.
 */
export type RotationOutcome =
  | { kind: "rotated"; userId: number; rawToken: string; familyId: string; expiresAt: Date }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "reuse"; familyId: string; revoked: number };

/**
 * Refresh tokens: opaque, hashed, single-use session credentials.
 *  - Own sessions (JWT mode): list, read and revoke only the caller's sessions.
 *  - Lifecycle (used by login/refresh/logout in ISS-15): issue starts a family, rotate
 *    consumes the token and issues the next one in the same family, and presenting a
 *    token that is no longer active is treated as theft: the whole family is revoked.
 */
export class RefreshTokensService {
  constructor(private readonly refreshTokensRepository = new RefreshTokensRepository()) {}

  // ================== OWN SESSIONS ==================

  async getAllMine(userId: number): Promise<RefreshTokenResponseDto[]> {
    return (await this.refreshTokensRepository.findActiveByUser(userId)).map(toRefreshTokenResponse);
  }

  async getMine(userId: number, rawId: string): Promise<RefreshTokenResponseDto> {
    return toRefreshTokenResponse(await this.findMineOrFail(userId, rawId));
  }

  // Idempotent: revoking an already revoked session leaves it revoked.
  async revokeMine(userId: number, rawId: string): Promise<RefreshTokenResponseDto> {
    const token = await this.findMineOrFail(userId, rawId);
    if (token.status === "active") await this.refreshTokensRepository.setStatus(token, "inactive");
    return toRefreshTokenResponse(token);
  }

  revokeAllMine(userId: number): Promise<number> {
    return this.refreshTokensRepository.revokeAllByUser(userId);
  }

  purgeMine(userId: number): Promise<number> {
    return this.refreshTokensRepository.purgeUnusableByUser(userId);
  }

  // ================== LIFECYCLE ==================

  // New login: a new family and its first token.
  async issue(userId: number, deviceInfo: string | null, transaction?: Transaction): Promise<IssuedSession> {
    const rawToken = generateOpaqueToken();
    const familyId = randomUUID();
    const expiresAt = expiryFromNow();
    await this.refreshTokensRepository.create(
      { userId, tokenHash: sha256Hex(rawToken), familyId, deviceInfo, expiresAt, status: "active" },
      transaction
    );
    return { rawToken, familyId, expiresAt };
  }

  /**
   * Consumes a refresh token and issues the next one of its family, in one transaction
   * with the row locked: of two concurrent requests with the same token one rotates and
   * the other finds it inactive, which is reuse and revokes the family.
   */
  rotate(rawToken: string, deviceInfo: string | null): Promise<RotationOutcome> {
    return withTransaction<RotationOutcome>(async (transaction) => {
      const current = await this.refreshTokensRepository.findByHash(sha256Hex(rawToken), transaction, true);
      if (!current) {
        return { kind: "invalid" };
      }
      if (current.status !== "active") {
        const revoked = await this.refreshTokensRepository.revokeFamily(current.familyId, transaction);
        return { kind: "reuse", familyId: current.familyId, revoked };
      }
      await this.refreshTokensRepository.setStatus(current, "inactive", transaction);
      if (new Date(current.expiresAt).getTime() <= Date.now()) {
        return { kind: "expired" };
      }

      const rawNext = generateOpaqueToken();
      const expiresAt = expiryFromNow();
      await this.refreshTokensRepository.create(
        {
          userId: current.userId,
          tokenHash: sha256Hex(rawNext),
          familyId: current.familyId,
          deviceInfo: deviceInfo ?? current.deviceInfo,
          expiresAt,
          status: "active",
        },
        transaction
      );
      return { kind: "rotated", userId: current.userId, rawToken: rawNext, familyId: current.familyId, expiresAt };
    });
  }

  // Logout of one session. Idempotent: an unknown or revoked token already does not work.
  async revokeByToken(rawToken: string): Promise<void> {
    const token = await this.refreshTokensRepository.findByHash(sha256Hex(rawToken));
    if (token?.status === "active") await this.refreshTokensRepository.setStatus(token, "inactive");
  }

  // ================== HELPERS ==================

  // The userId filter is the security boundary: another user's session answers 404, not
  // 403, so its existence is not disclosed.
  private async findMineOrFail(userId: number, rawId: string): Promise<RefreshToken> {
    const id = parseId(rawId);
    const token = await this.refreshTokensRepository.findById(id);
    if (!token || token.userId !== userId) {
      throw new NotFoundError(`Sesión no encontrada: ${id}`);
    }
    return token;
  }
}

const expiryFromNow = (): Date => new Date(Date.now() + refreshTtlDays() * 24 * 60 * 60 * 1000);
