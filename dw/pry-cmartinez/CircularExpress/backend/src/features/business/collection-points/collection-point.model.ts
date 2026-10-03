import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from "sequelize";
import { sequelize } from "../../../database/db";
import { Route } from "../routes/route.model";

export const COLLECTION_POINT_STATUSES = ["active", "inactive"] as const;
export type CollectionPointStatus = (typeof COLLECTION_POINT_STATUSES)[number];

export class CollectionPoint extends Model<
  InferAttributes<CollectionPoint>,
  InferCreationAttributes<CollectionPoint>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare address: CreationOptional<string | null>;
  declare description: CreationOptional<string | null>;
  declare routeId: ForeignKey<Route["id"]>;
  declare status: CreationOptional<CollectionPointStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Filled when the query includes the "route" association.
  declare route?: NonAttribute<Route>;
}

CollectionPoint.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...COLLECTION_POINT_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "CollectionPoint",
    tableName: "collection_points",
    timestamps: true,
    underscored: true,
    // A point name is unique within its route.
    indexes: [{ name: "collection_points_name_route_unique", unique: true, fields: ["name", "route_id"] }],
  }
);
