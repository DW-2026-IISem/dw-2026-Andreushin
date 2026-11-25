import { Op, Transaction } from "sequelize";
import { RefreshToken, RefreshTokenCreationAttributes, RefreshTokenStatus } from "./refresh-token.model";

/**
 * Persistence of refresh tokens. The plain token is never stored, so lookups go by its
 * SHA-256. The queries taking part in a rotation accept a transaction and, when asked,
 * lock the row (`SELECT ... FOR UPDATE`) so two concurrent refreshes cannot both win.
 */
export class RefreshTokensRepository {
  // ================== READ ==================

  findByHash(tokenHash: string, transaction?: Transaction, lock = false): Promise<RefreshToken | null> {
    return RefreshToken.findOne({
      where: { tokenHash },
      transaction,
      ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  }

  findActiveByUser(userId: number): Promise<RefreshToken[]> {
    return RefreshToken.findAll({ where: { userId, status: "active" }, order: [["id", "DESC"]] });
  }

  findById(id: number): Promise<RefreshToken | null> {
    return RefreshToken.findByPk(id);
  }

  // ================== CREATE ==================

  create(data: RefreshTokenCreationAttributes, transaction?: Transaction): Promise<RefreshToken> {
    return RefreshToken.create(data, { transaction });
  }

  // ================== UPDATE ==================

  setStatus(token: RefreshToken, status: RefreshTokenStatus, transaction?: Transaction): Promise<RefreshToken> {
    return token.update({ status }, { transaction });
  }

  // Revokes the whole rotation chain of a login (reuse detection or logout of a device).
  async revokeFamily(familyId: string, transaction?: Transaction): Promise<number> {
    const [revoked] = await RefreshToken.update({ status: "inactive" }, { where: { familyId, status: "active" }, transaction });
    return revoked;
  }

  // Global logout: every active session of the user.
  async revokeAllByUser(userId: number): Promise<number> {
    const [revoked] = await RefreshToken.update({ status: "inactive" }, { where: { userId, status: "active" } });
    return revoked;
  }

  // ================== DELETE ==================

  // Physical delete of the sessions that can no longer be used (revoked or expired).
  purgeUnusableByUser(userId: number): Promise<number> {
    return RefreshToken.destroy({
      where: { userId, [Op.or]: [{ status: "inactive" }, { expiresAt: { [Op.lte]: new Date() } }] },
    });
  }
}
