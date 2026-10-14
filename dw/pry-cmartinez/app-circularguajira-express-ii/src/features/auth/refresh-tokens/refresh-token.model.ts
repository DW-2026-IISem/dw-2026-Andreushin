import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type RefreshTokenStatus = "active" | "inactive";

export interface RefreshTokenAttributes {
  id: number;
  userId: number;
  // SHA-256 of the opaque token: the plain value is never stored.
  tokenHash: string;
  // Groups the tokens rotated from one login; reuse of a rotated token revokes the family.
  familyId: string;
  deviceInfo: string | null;
  expiresAt: Date;
  status: RefreshTokenStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RefreshTokenCreationAttributes = Optional<RefreshTokenAttributes, "id" | "deviceInfo" | "status">;

/**
 * RefreshToken (refresh_tokens): renewable and revocable session, the only persisted
 * session artifact (the access JWT is self-contained). Deliberate deviation: status
 * defaults to active, a freshly issued token is valid by definition.
 */
export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: number;
  declare userId: number;
  declare tokenHash: string;
  declare familyId: string;
  declare deviceInfo: string | null;
  declare expiresAt: Date;
  declare status: RefreshTokenStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      // Sessions die with their user; they are not business history.
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "uq_refresh_tokens_token_hash",
    },
    familyId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    deviceInfo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    tableName: "refresh_tokens",
    modelName: "RefreshToken",
    underscored: true,
    timestamps: true,
    indexes: [
      { name: "ix_refresh_tokens_family_id", fields: ["family_id"] },
      { name: "ix_refresh_tokens_user_id", fields: ["user_id"] },
    ],
  }
);
