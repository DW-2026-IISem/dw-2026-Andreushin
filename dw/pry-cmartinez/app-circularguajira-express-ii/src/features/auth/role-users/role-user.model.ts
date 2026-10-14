import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type RoleUserStatus = "active" | "inactive";

export interface RoleUserAttributes {
  id: number;
  userId: number;
  roleId: number;
  status: RoleUserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleUserCreationAttributes = Optional<RoleUserAttributes, "id" | "status">;

/**
 * RoleUser (role_users): N:M User <-> Role, first link of the authorization chain.
 * Unique (user_id, role_id): revoking and granting again changes `status`, never duplicates.
 */
export class RoleUser extends Model<RoleUserAttributes, RoleUserCreationAttributes> implements RoleUserAttributes {
  declare id: number;
  declare userId: number;
  declare roleId: number;
  declare status: RoleUserStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

const foreignKey = (table: string) => ({
  type: DataTypes.INTEGER,
  allowNull: false,
  references: { model: table, key: "id" },
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

RoleUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: foreignKey("users"),
    roleId: foreignKey("roles"),
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "role_users",
    modelName: "RoleUser",
    underscored: true,
    timestamps: true,
    indexes: [
      { name: "uq_role_users_user_role", unique: true, fields: ["user_id", "role_id"] },
      { name: "ix_role_users_role_id", fields: ["role_id"] },
    ],
  }
);
