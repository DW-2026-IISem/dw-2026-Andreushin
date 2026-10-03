import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import { sequelize } from "../../../database/db";

export const ROUTE_STATUSES = ["active", "inactive"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export class Route extends Model<InferAttributes<Route>, InferCreationAttributes<Route>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare municipality: string;
  declare description: CreationOptional<string | null>;
  declare status: CreationOptional<RouteStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Route.init(
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
    municipality: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "active",
      validate: { isIn: [[...ROUTE_STATUSES]] },
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Route",
    tableName: "routes",
    timestamps: true,
    underscored: true,
    // A route name is unique within its municipality.
    indexes: [{ name: "routes_name_municipality_unique", unique: true, fields: ["name", "municipality"] }],
  }
);
