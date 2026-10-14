import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type ResourceRoleStatus = "active" | "inactive";

export interface ResourceRoleAttributes {
  id: number;
  roleId: number;
  resourceId: number;
  status: ResourceRoleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ResourceRoleCreationAttributes = Optional<ResourceRoleAttributes, "id" | "status">;

/**
 * ResourceRole (resource_roles): the grant Role <-> Resource. This row IS the permission;
 * there is no Permission entity. Grant = insert or reactivate; revoke = status inactive.
 */
export class ResourceRole
  extends Model<ResourceRoleAttributes, ResourceRoleCreationAttributes>
  implements ResourceRoleAttributes
{
  declare id: number;
  declare roleId: number;
  declare resourceId: number;
  declare status: ResourceRoleStatus;
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

ResourceRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: foreignKey("roles"),
    resourceId: foreignKey("resources"),
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "resource_roles",
    modelName: "ResourceRole",
    underscored: true,
    timestamps: true,
    indexes: [
      { name: "uq_resource_roles_role_resource", unique: true, fields: ["role_id", "resource_id"] },
      { name: "ix_resource_roles_resource_id", fields: ["resource_id"] },
    ],
  }
);
