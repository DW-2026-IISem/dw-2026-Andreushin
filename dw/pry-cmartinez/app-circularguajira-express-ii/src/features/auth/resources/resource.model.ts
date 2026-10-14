import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";
import { normalizePath } from "../../../shared/auth/resource-match";

export type ResourceStatus = "active" | "inactive";
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export interface ResourceAttributes {
  id: number;
  method: string;
  // Pattern with parameters, e.g. /api/collections/:id (never a concrete id).
  path: string;
  description: string | null;
  status: ResourceStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ResourceCreationAttributes = Optional<ResourceAttributes, "id" | "description" | "status">;

/**
 * Resource (resources): a protectable access point, the pair (method, path).
 * GET /api/collections and POST /api/collections are two different resources.
 */
export class Resource extends Model<ResourceAttributes, ResourceCreationAttributes> implements ResourceAttributes {
  declare id: number;
  declare method: string;
  declare path: string;
  declare description: string | null;
  declare status: ResourceStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Resource.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: { args: [[...HTTP_METHODS]], msg: "method debe ser GET, POST, PUT, PATCH o DELETE" } },
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "path no puede estar vacío" } },
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
    tableName: "resources",
    modelName: "Resource",
    underscored: true,
    timestamps: true,
    // The exact (method, path) pair never repeats.
    indexes: [{ name: "uq_resources_method_path", unique: true, fields: ["method", "path"] }],
    hooks: {
      // Uppercase verb and normalized path, so the pattern comparison is deterministic.
      beforeValidate: (resource: Resource) => {
        if (typeof resource.method === "string") resource.method = resource.method.trim().toUpperCase();
        if (typeof resource.path === "string") resource.path = normalizePath(resource.path.trim());
      },
    },
  }
);
