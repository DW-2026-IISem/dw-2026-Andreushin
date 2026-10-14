import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";
import { decimalColumn } from "../../../shared/database/decimal";

// issued = valid settlement (locks its collection); voided = logical delete.
export type SettlementStatus = "issued" | "voided";

export interface SettlementAttributes {
  id: number;
  collectionId: number;
  recyclerId: number;
  settledAt: Date;
  // Frozen values computed from the collection weighings when issued.
  totalNetKg: number;
  totalAmount: number;
  lineCount: number;
  status: SettlementStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SettlementCreationAttributes = Optional<SettlementAttributes, "id" | "notes">;

// Settlement (liquidación): what is paid to the recycler for one collection.
export class Settlement
  extends Model<SettlementAttributes, SettlementCreationAttributes>
  implements SettlementAttributes
{
  declare id: number;
  declare collectionId: number;
  declare recyclerId: number;
  declare settledAt: Date;
  declare totalNetKg: number;
  declare totalAmount: number;
  declare lineCount: number;
  declare status: SettlementStatus;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Settlement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    collectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "collections", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    recyclerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "recyclers", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalNetKg: decimalColumn("totalNetKg", 12, 2),
    totalAmount: decimalColumn("totalAmount", 14, 2),
    lineCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("issued", "voided"),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "settlements",
    modelName: "Settlement",
    underscored: true,
    timestamps: true,
  }
);
