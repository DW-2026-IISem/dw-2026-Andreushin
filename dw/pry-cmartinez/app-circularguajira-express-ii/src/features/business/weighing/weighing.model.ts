import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../database/db";
import { decimalColumn } from "../../../shared/database/decimal";

export type WeighingStatus = "active" | "inactive";

export interface WeighingAttributes {
  id: number;
  collectionId: number;
  materialId: number;
  // Rate applied (reference + price snapshot): the settlement stays verifiable.
  rateId: number;
  pricePerKg: number;
  grossKg: number;
  tareKg: number;
  netKg: number;
  amount: number;
  status: WeighingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export type WeighingCreationAttributes = Optional<WeighingAttributes, "id" | "status">;

// Weighing (pesaje): one material weighed on the scale within a collection.
export class Weighing
  extends Model<WeighingAttributes, WeighingCreationAttributes>
  implements WeighingAttributes
{
  declare id: number;
  declare collectionId: number;
  declare materialId: number;
  declare rateId: number;
  declare pricePerKg: number;
  declare grossKg: number;
  declare tareKg: number;
  declare netKg: number;
  declare amount: number;
  declare status: WeighingStatus;
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

Weighing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    collectionId: foreignKey("collections"),
    materialId: foreignKey("materials"),
    rateId: foreignKey("material_rates"),
    pricePerKg: decimalColumn("pricePerKg", 12, 2),
    grossKg: decimalColumn("grossKg", 10, 2),
    tareKg: decimalColumn("tareKg", 10, 2),
    netKg: decimalColumn("netKg", 10, 2),
    amount: decimalColumn("amount", 14, 2),
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      // Fail-safe: a row inserted without explicit status stays hidden; the API sends "active".
      defaultValue: "inactive",
    },
  },
  {
    sequelize,
    tableName: "weighings",
    modelName: "Weighing",
    underscored: true,
    timestamps: true,
  }
);
