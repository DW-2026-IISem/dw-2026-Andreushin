import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";

export type RouteStatus = "active" | "inactive";

export interface RouteAttributes {
  id: number;
  name: string;
  municipality: string;
  description: string | null;
  status: RouteStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RouteCreationAttributes = Optional<RouteAttributes, "id" | "description" | "status">;

// Collection route: a planned circuit through collection points in one municipality.
export class Route extends Model<RouteAttributes, RouteCreationAttributes> implements RouteAttributes {
  declare id: number;
  declare name: string;
  declare municipality: string;
  declare description: string | null;
  declare status: RouteStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Route.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    municipality: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: "routes",
    modelName: "Route",
    underscored: true,
    timestamps: true,
  }
);
