import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type CollectionPointStatus = "active" | "inactive";

export interface CollectionPointAttributes {
  id: number;
  routeId: number;
  name: string;
  address: string;
  // Position of the stop within its route (1 = first visit).
  visitOrder: number;
  status: CollectionPointStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CollectionPointCreationAttributes = Optional<CollectionPointAttributes, "id" | "status">;

export class CollectionPoint
  extends Model<CollectionPointAttributes, CollectionPointCreationAttributes>
  implements CollectionPointAttributes
{
  declare id: number;
  declare routeId: number;
  declare name: string;
  declare address: string;
  declare visitOrder: number;
  declare status: CollectionPointStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CollectionPoint.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "routes", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    visitOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      // Fail-safe: a row inserted without explicit status stays hidden; the API sends "active".
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "collection_points",
    modelName: "CollectionPoint",
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ["route_id", "visit_order"] }],
  }
);
