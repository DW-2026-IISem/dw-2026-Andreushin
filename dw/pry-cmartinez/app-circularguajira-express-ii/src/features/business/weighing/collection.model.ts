import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";
import { decimalColumn } from "../../../shared/database/decimal";

export type CollectionStatus = "active" | "inactive";

export interface CollectionAttributes {
  id: number;
  recyclerId: number;
  routeId: number;
  // Calendar date of the delivery; it decides which material rate applies.
  collectedOn: string;
  // Derived from the active weighings (never sent by the client).
  totalNetKg: number;
  totalAmount: number;
  status: CollectionStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CollectionCreationAttributes = Optional<
  CollectionAttributes,
  "id" | "totalNetKg" | "totalAmount" | "status"
>;

// Collection (recolección): a recycler's delivery on a route, header of its weighings.
export class Collection
  extends Model<CollectionAttributes, CollectionCreationAttributes>
  implements CollectionAttributes
{
  declare id: number;
  declare recyclerId: number;
  declare routeId: number;
  declare collectedOn: string;
  declare totalNetKg: number;
  declare totalAmount: number;
  declare status: CollectionStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Collection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    recyclerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "recyclers", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    routeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "routes", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    collectedOn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalNetKg: decimalColumn("totalNetKg", 12, 2, 0),
    totalAmount: decimalColumn("totalAmount", 14, 2, 0),
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      // Fail-safe: a row inserted without explicit status stays hidden; the API sends "active".
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "collections",
    modelName: "Collection",
    underscored: true,
    timestamps: true,
  }
);
