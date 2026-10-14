import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type RoleStatus = "active" | "inactive";

export interface RoleAttributes {
  id: number;
  name: string;
  description: string | null;
  status: RoleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RoleCreationAttributes = Optional<RoleAttributes, "id" | "description" | "status">;

/**
 * Role (roles): groups responsibilities (ADMIN, LOGISTICA, BASCULA, PLANTA, FINANZAS).
 * The name authorizes nothing by itself: only its active grants in resource_roles do.
 */
export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare status: RoleStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: "uq_roles_name",
      validate: { notEmpty: { msg: "name no puede estar vacío" } },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "roles",
    modelName: "Role",
    underscored: true,
    timestamps: true,
    hooks: {
      // A role name is a functional identifier: always uppercase.
      beforeValidate: (role: Role) => {
        if (typeof role.name === "string") role.name = role.name.trim().toUpperCase();
      },
    },
  }
);
